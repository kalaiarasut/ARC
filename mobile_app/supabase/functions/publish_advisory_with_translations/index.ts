/// <reference path="../types.d.ts" />

import {
  computeChangedFields,
  handleCors,
  insertAdminAuditEvent,
  jsonResponse,
  requireAdmin,
} from "../_shared_admin.ts";

const REQUIRED_LANGUAGES = ["bn", "gu", "hi", "kn", "ml", "mr", "or", "ta", "te"];

const buildTranslationRows = (translations: any[], advisoryId: string, reviewerId: string) => {
  const now = new Date().toISOString();
  return translations.map((item: any) => ({
    advisory_id: advisoryId,
    language_code: item.language_code,
    title: item.title,
    body: item.body,
    region: item.region ?? null,
    translation_status: item.translation_status ?? "reviewed",
    provider: item.provider ?? null,
    model: item.model ?? null,
    translated_at: now,
    reviewed_at: item.translation_status === "reviewed" ? now : null,
    reviewed_by: item.translation_status === "reviewed" ? reviewerId : null,
  }));
};

const normalizeTranslations = (rows: any[]) =>
  [...rows]
    .map((item) => ({
      language_code: item.language_code,
      title: item.title,
      body: item.body,
      region: item.region ?? null,
      translation_status: item.translation_status ?? "generated",
      provider: item.provider ?? null,
      model: item.model ?? null,
    }))
    .sort((a, b) => String(a.language_code).localeCompare(String(b.language_code)));

const buildAdvisorySnapshot = (advisory: any, translations: any[]) => ({
  title: advisory.title,
  body: advisory.body,
  region: advisory.region ?? null,
  severity: advisory.severity,
  category: advisory.category,
  source_language: advisory.source_language ?? "en",
  latitude: advisory.latitude ?? null,
  longitude: advisory.longitude ?? null,
  radius_km: advisory.radius_km ?? null,
  starts_at: advisory.starts_at ?? null,
  expires_at: advisory.expires_at ?? null,
  contact_phone: advisory.contact_phone ?? null,
  contact_whatsapp: advisory.contact_whatsapp ?? null,
  contact_hotline: advisory.contact_hotline ?? null,
  translations: normalizeTranslations(translations),
});

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
  const auditReason = String(payload.audit_reason ?? "").trim() || null;
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
    if (!auditReason || auditReason.length < 3) {
      return jsonResponse({ error: "Audit reason is required for advisory edits" }, 400);
    }

    const { data: previousAdvisory, error: previousAdvisoryError } = await auth.supabase
      .from("official_advisories")
      .select("*")
      .eq("id", advisoryId)
      .single();

    if (previousAdvisoryError || !previousAdvisory) {
      return jsonResponse({ error: previousAdvisoryError?.message ?? "Advisory not found" }, 404);
    }

    const { data: previousTranslations, error: previousTranslationsError } = await auth.supabase
      .from("official_advisory_translations")
      .select("language_code, title, body, region, translation_status, provider, model")
      .eq("advisory_id", advisoryId);

    if (previousTranslationsError) {
      return jsonResponse({ error: previousTranslationsError.message }, 400);
    }

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
        const rows = buildTranslationRows(translations, advisoryId, auth.user.id);

        const { error: insertError } = await auth.supabase
          .from("official_advisory_translations")
          .insert(rows);

        if (insertError) {
          return jsonResponse({ error: insertError.message }, 400);
        }
      }
    }

    const { data: currentTranslations, error: currentTranslationsError } = await auth.supabase
      .from("official_advisory_translations")
      .select("language_code, title, body, region, translation_status, provider, model")
      .eq("advisory_id", advisoryId);

    if (currentTranslationsError) {
      return jsonResponse({ error: currentTranslationsError.message }, 400);
    }

    const oldSnapshot = buildAdvisorySnapshot(previousAdvisory, previousTranslations ?? []);
    const newSnapshot = buildAdvisorySnapshot(advisory, currentTranslations ?? []);

    try {
      await insertAdminAuditEvent(auth.supabase, {
        entity_type: "advisory",
        entity_id: advisoryId,
        action: "updated",
        actor_user_id: auth.user.id,
        actor_email: auth.user.email ?? null,
        reason: auditReason,
        old_data: oldSnapshot,
        new_data: newSnapshot,
        changed_fields: computeChangedFields(oldSnapshot, newSnapshot),
        metadata: {
          entity_label: advisory.title,
          translation_count: (currentTranslations ?? []).length,
          replace_translations: replaceTranslations,
        },
      });
    } catch (auditError) {
      return jsonResponse(
        { error: auditError instanceof Error ? auditError.message : "Failed to write advisory audit event" },
        500,
      );
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

  const advisory = data;
  const advisoryRowId = String(advisory?.id ?? "").trim();
  if (!advisoryRowId) {
    return jsonResponse({ error: "Published advisory id missing from RPC response" }, 500);
  }

  const { data: currentTranslations, error: currentTranslationsError } = await auth.supabase
    .from("official_advisory_translations")
    .select("language_code, title, body, region, translation_status, provider, model")
    .eq("advisory_id", advisoryRowId);

  if (currentTranslationsError) {
    return jsonResponse({ error: currentTranslationsError.message }, 400);
  }

  const newSnapshot = buildAdvisorySnapshot(advisory, currentTranslations ?? []);

  try {
    await insertAdminAuditEvent(auth.supabase, {
      entity_type: "advisory",
      entity_id: advisoryRowId,
      action: "created",
      actor_user_id: auth.user.id,
      actor_email: auth.user.email ?? null,
      reason: auditReason,
      old_data: null,
      new_data: newSnapshot,
      changed_fields: computeChangedFields(null, newSnapshot),
      metadata: {
        entity_label: advisory.title,
        translation_count: (currentTranslations ?? []).length,
        replace_translations: true,
      },
    });
  } catch (auditError) {
    return jsonResponse(
      { error: auditError instanceof Error ? auditError.message : "Failed to write advisory audit event" },
      500,
    );
  }

  return jsonResponse({ advisory });
});
