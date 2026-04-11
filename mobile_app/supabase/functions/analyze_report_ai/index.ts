/// <reference path="../types.d.ts" />

import {
  handleCors,
  insertAdminAuditEvent,
  jsonResponse,
  requireAdmin,
} from "../_shared_admin.ts";
import {
  buildCompletedAnalysis,
  computeNextRetryAt,
  MAX_ANALYSIS_ATTEMPTS,
  type ReportRecord,
} from "../_report_ai.ts";

const selectReport = async (supabase: any, reportId: string) => {
  const { data, error } = await supabase
    .from("hazard_reports")
    .select(`
      id,
      hazard_type,
      description,
      translated_english,
      translation_status,
      urgency_level,
      is_high_risk,
      people_at_risk,
      immediate_danger_status,
      affected_people_band,
      media_urls,
      upload_complete,
      event_time,
      created_at,
      report_ai_analysis(*)
    `)
    .eq("id", reportId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Report not found");
  }

  return data as ReportRecord & { report_ai_analysis?: Record<string, unknown> | null };
};

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const reportId = String(payload?.report_id ?? "").trim();
  const force = Boolean(payload?.force);

  if (!reportId) {
    return jsonResponse({ error: "report_id is required" }, 400);
  }

  let report: ReturnType<typeof selectReport> extends Promise<infer T> ? T : never;
  try {
    report = await selectReport(auth.supabase, reportId);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Report not found" }, 404);
  }

  const existingAnalysis = (report.report_ai_analysis ?? null) as Record<string, unknown> | null;
  const translationStatus = String(report.translation_status ?? "pending");
  if (!force && translationStatus !== "completed" && translationStatus !== "skipped") {
    return jsonResponse({ error: "Report translation is not ready for AI scoring" }, 409);
  }

  const nextAttempt = Number(existingAnalysis?.analysis_attempts ?? 0) + 1;
  const nowIso = new Date().toISOString();

  const { error: claimError } = await auth.supabase
    .from("report_ai_analysis")
    .upsert({
      report_id: reportId,
      analysis_status: "processing",
      analysis_attempts: nextAttempt,
      last_attempt_at: nowIso,
      last_error: null,
      next_retry_at: null,
      needs_recompute: false,
    });

  if (claimError) {
    return jsonResponse({ error: claimError.message }, 500);
  }

  try {
    const completed = await buildCompletedAnalysis(report);
    const { error: updateError } = await auth.supabase
      .from("report_ai_analysis")
      .update({
        ...completed,
        last_error: null,
        next_retry_at: null,
        needs_recompute: false,
      })
      .eq("report_id", reportId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await auth.supabase.from("report_ai_runs").insert({
      report_id: reportId,
      run_kind: force ? "manual_retry" : "base",
      status: completed.analysis_status === "completed" ? "completed" : "partial",
      provider_primary: completed.provider_primary,
      model_primary: completed.model_primary,
      provider_fallback: completed.provider_fallback,
      model_fallback: completed.model_fallback,
      prompt_version: "report-ai-v1",
      summary: completed.summary,
      score_snapshot: completed.operational_score,
      metadata_json: {
        bucket: completed.score_bucket,
        confidence_score: completed.confidence_score,
        processed_modalities_json: completed.processed_modalities_json,
      },
    });

    await insertAdminAuditEvent(auth.supabase, {
      entity_type: "report_ai_analysis",
      entity_id: reportId,
      action: "recomputed",
      actor_user_id: auth.user.id,
      actor_email: auth.user.email ?? null,
      old_data: existingAnalysis,
      new_data: {
        analysis_status: completed.analysis_status,
        operational_score: completed.operational_score,
        score_bucket: completed.score_bucket,
        recommended_action: completed.recommended_action,
      },
      metadata: {
        provider_primary: completed.provider_primary,
        model_primary: completed.model_primary,
        confidence_score: completed.confidence_score,
      },
    });

    return jsonResponse({
      report_id: reportId,
      ai_analysis: completed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze report";
    const retryAllowed = nextAttempt < MAX_ANALYSIS_ATTEMPTS;

    await auth.supabase
      .from("report_ai_analysis")
      .update({
        analysis_status: "failed",
        last_error: message,
        next_retry_at: retryAllowed ? computeNextRetryAt(nextAttempt) : null,
        needs_recompute: retryAllowed,
      })
      .eq("report_id", reportId);

    await auth.supabase.from("report_ai_runs").insert({
      report_id: reportId,
      run_kind: force ? "manual_retry" : "base",
      status: "failed",
      prompt_version: "report-ai-v1",
      error_text: message,
      metadata_json: {
        attempt: nextAttempt,
      },
    });

    return jsonResponse({ error: message }, 500);
  }
});
