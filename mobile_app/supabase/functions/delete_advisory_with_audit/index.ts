/// <reference path="../types.d.ts" />

import {
  computeChangedFields,
  handleCors,
  insertAdminAuditEvent,
  jsonResponse,
  requireAdmin,
} from "../_shared_admin.ts";

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

  const advisoryId = String(payload.advisory_id ?? "").trim();
  const auditReason = String(payload.audit_reason ?? "").trim();

  if (!advisoryId) {
    return jsonResponse({ error: "Missing advisory id" }, 400);
  }

  if (auditReason.length < 3) {
    return jsonResponse({ error: "Audit reason is required for advisory deletion" }, 400);
  }

  const { data: advisory, error: advisoryError } = await auth.supabase
    .from("official_advisories")
    .select("*")
    .eq("id", advisoryId)
    .single();

  if (advisoryError || !advisory) {
    return jsonResponse({ error: advisoryError?.message ?? "Advisory not found" }, 404);
  }

  const { data: translations, error: translationsError } = await auth.supabase
    .from("official_advisory_translations")
    .select("language_code, title, body, region, translation_status, provider, model")
    .eq("advisory_id", advisoryId);

  if (translationsError) {
    return jsonResponse({ error: translationsError.message }, 400);
  }

  const oldSnapshot = buildAdvisorySnapshot(advisory, translations ?? []);

  const { error: deleteError } = await auth.supabase
    .from("official_advisories")
    .delete()
    .eq("id", advisoryId);

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 400);
  }

  try {
    await insertAdminAuditEvent(auth.supabase, {
      entity_type: "advisory",
      entity_id: advisoryId,
      action: "deleted",
      actor_user_id: auth.user.id,
      actor_email: auth.user.email ?? null,
      reason: auditReason,
      old_data: oldSnapshot,
      new_data: null,
      changed_fields: computeChangedFields(oldSnapshot, null),
      metadata: {
        entity_label: advisory.title,
        translation_count: (translations ?? []).length,
      },
    });
  } catch (auditError) {
    return jsonResponse(
      { error: auditError instanceof Error ? auditError.message : "Failed to write advisory audit event" },
      500,
    );
  }

  return jsonResponse({ success: true });
});
