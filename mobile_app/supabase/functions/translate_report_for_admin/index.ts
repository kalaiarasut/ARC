/// <reference path="../types.d.ts" />

import {
  handleCors,
  isAdminUser,
  jsonResponse,
  requireAuthenticatedUser,
} from "../_shared_admin.ts";
import {
  computeNextRetryAt,
  MAX_TRANSLATION_ATTEMPTS,
  normalizeLanguageCode,
  translateReportDescription,
} from "../_report_translation.ts";

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const reportId = String(payload?.report_id ?? "").trim();
  const force = Boolean(payload?.force);
  if (!reportId) {
    return jsonResponse({ error: "report_id is required" }, 400);
  }

  const { data: report, error: reportError } = await auth.supabase
    .from("hazard_reports")
    .select("id, user_id, description, detected_language, translated_english, translation_provider, translation_model, translated_at, translation_status, translation_attempts")
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    return jsonResponse({ error: reportError?.message ?? "Report not found" }, 404);
  }

  let isAdmin = false;
  try {
    isAdmin = await isAdminUser(auth.supabase, auth.user.id);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to verify admin role" },
      500,
    );
  }

  if (!isAdmin && report.user_id !== auth.user.id) {
    return jsonResponse({ error: "Not allowed to translate this report" }, 403);
  }

  const originalDescription = String(report.description ?? "").trim();
  if (
    !force &&
    typeof report.translated_english === "string" &&
    report.translated_english.trim() &&
    report.translation_status === "completed"
  ) {
    return jsonResponse({
      report_id: report.id,
      original_description: originalDescription,
      detected_language: normalizeLanguageCode(report.detected_language) ?? "en",
      translated_english: report.translated_english.trim(),
      translation_provider: report.translation_provider,
      translation_model: report.translation_model,
      translated_at: report.translated_at,
      translation_status: report.translation_status ?? "completed",
      translation_attempts: report.translation_attempts ?? 0,
    });
  }

  const nextAttempt = Number(report.translation_attempts ?? 0) + 1;
  const { error: processingError } = await auth.supabase
    .from("hazard_reports")
    .update({
      translation_status: "processing",
      translation_attempts: nextAttempt,
      translation_last_attempt_at: new Date().toISOString(),
      translation_last_error: null,
      translation_next_retry_at: null,
    })
    .eq("id", report.id);

  if (processingError) {
    return jsonResponse({ error: processingError.message }, 500);
  }

  try {
    const outcome = await translateReportDescription(originalDescription);
    const { error: updateError } = await auth.supabase
      .from("hazard_reports")
      .update({
        translation_status: outcome.status,
        detected_language: outcome.detected_language,
        translated_english: outcome.translated_english,
        translation_provider: outcome.translation_provider,
        translation_model: outcome.translation_model,
        translated_at: outcome.translated_at,
        translation_last_error: null,
        translation_next_retry_at: null,
      })
      .eq("id", report.id);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({
      report_id: report.id,
      original_description: originalDescription,
      detected_language: outcome.detected_language,
      translated_english: outcome.translated_english,
      translation_provider: outcome.translation_provider,
      translation_model: outcome.translation_model,
      translated_at: outcome.translated_at,
      translation_status: outcome.status,
      translation_attempts: nextAttempt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to translate report";
    const retryAllowed = nextAttempt < MAX_TRANSLATION_ATTEMPTS;
    await auth.supabase
      .from("hazard_reports")
      .update({
        translation_status: "failed",
        translation_last_error: errorMessage,
        translation_next_retry_at: retryAllowed ? computeNextRetryAt(nextAttempt) : null,
      })
      .eq("id", report.id);

    return jsonResponse(
      {
        error: errorMessage,
        translation_status: "failed",
        translation_attempts: nextAttempt,
      },
      500,
    );
  }
});
