/// <reference path="../types.d.ts" />

import { handleCors, jsonResponse, requireAdmin } from "../_shared_admin.ts";

const REQUIRED_LANGUAGES = ["bn", "gu", "hi", "kn", "ml", "mr", "or", "ta", "te"];

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const translations = Array.isArray(payload.translations) ? payload.translations : [];
  const advisoryId = String(payload.advisory_id ?? "").trim();
  const replaceTranslations = advisoryId ? Boolean(payload.replace_translations) : true;
  const translationCodes = new Set(
    translations
      .map((item: any) => String(item?.language_code ?? "").trim().toLowerCase())
      .filter(Boolean),
  );

  if (replaceTranslations) {
    for (const code of REQUIRED_LANGUAGES) {
      if (!translationCodes.has(code)) {
        return jsonResponse({ error: `Missing reviewed translation for ${code}` }, 400);
      }
    }
  }

  if (advisoryId) {
    const advisoryUpdate = {
      title: payload.title,
      body: payload.body,
      region: payload.region ?? null,
      severity: payload.severity ?? "info",
      category: payload.category ?? "warning",
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      radius_km: payload.radius_km ?? null,
      starts_at: payload.starts_at ?? null,
      expires_at: payload.expires_at ?? null,
      contact_phone: payload.contact_phone ?? null,
      contact_whatsapp: payload.contact_whatsapp ?? null,
      contact_hotline: payload.contact_hotline ?? null,
      source_language: payload.source_language ?? "en",
    };

    const { data: advisory, error: advisoryError } = await auth.supabase
      .from("official_advisories")
      .update(advisoryUpdate)
      .eq("id", advisoryId)
      .select("*")
      .single();

    if (advisoryError) {
      return jsonResponse({ error: advisoryError.message }, 400);
    }

    if (replaceTranslations) {
      const { error: deleteError } = await auth.supabase
        .from("official_advisory_translations")
        .delete()
        .eq("advisory_id", advisoryId);

      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 400);
      }

      if (translations.length > 0) {
        const rows = translations.map((item: any) => ({
          advisory_id: advisoryId,
          language_code: item.language_code,
          title: item.title,
          body: item.body,
          region: item.region ?? null,
          translation_status: item.translation_status ?? "reviewed",
          provider: item.provider ?? null,
          model: item.model ?? null,
          translated_at: new Date().toISOString(),
          reviewed_at: item.translation_status === "reviewed" ? new Date().toISOString() : null,
          reviewed_by: item.translation_status === "reviewed" ? auth.user.id : null,
        }));

        const { error: insertError } = await auth.supabase
          .from("official_advisory_translations")
          .insert(rows);

        if (insertError) {
          return jsonResponse({ error: insertError.message }, 400);
        }
      }
    }

    return jsonResponse({ advisory });
  }

  const { data, error } = await auth.supabase.rpc("admin_publish_official_advisory_with_translations", {
    p_title: payload.title,
    p_body: payload.body,
    p_region: payload.region ?? null,
    p_severity: payload.severity ?? "info",
    p_category: payload.category ?? "warning",
    p_latitude: payload.latitude ?? null,
    p_longitude: payload.longitude ?? null,
    p_radius_km: payload.radius_km ?? null,
    p_starts_at: payload.starts_at ?? null,
    p_expires_at: payload.expires_at ?? null,
    p_contact_phone: payload.contact_phone ?? null,
    p_contact_whatsapp: payload.contact_whatsapp ?? null,
    p_contact_hotline: payload.contact_hotline ?? null,
    p_source_language: payload.source_language ?? "en",
    p_translations: translations,
  });

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ advisory: data });
});
