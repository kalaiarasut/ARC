/// <reference path="../types.d.ts" />

import {
  handleCors,
  jsonResponse,
  requireWorkerSecret,
} from "../_shared_admin.ts";
import {
  computeNextRetryAt,
  MAX_TRANSLATION_ATTEMPTS,
  translateReportDescription,
} from "../_report_translation.ts";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 10;
const MAX_CONCURRENCY = 3;

const runWithConcurrency = async <T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) => {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const nextItem = queue.shift();
      if (!nextItem) return;
      await worker(nextItem);
    }
  });
  await Promise.all(runners);
};

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const workerAuth = await requireWorkerSecret(request);
  if (workerAuth instanceof Response) return workerAuth;

  const payload = await request.json().catch(() => null);
  const requestedLimit = Number(payload?.limit ?? DEFAULT_BATCH_SIZE);
  const batchSize = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(requestedLimit)))
    : DEFAULT_BATCH_SIZE;
  const nowIso = new Date().toISOString();

  const { data: candidates, error: fetchError } = await workerAuth.supabase
    .from("hazard_reports")
    .select("id, description, translation_status, translation_attempts, translation_next_retry_at, created_at")
    .in("translation_status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(batchSize * 5);

  if (fetchError) {
    return jsonResponse({ error: fetchError.message }, 500);
  }

  const eligible = (candidates ?? [])
    .filter((report: any) => {
      const status = String(report.translation_status ?? "pending");
      const attempts = Number(report.translation_attempts ?? 0);
      if (status === "pending") return true;
      if (status !== "failed") return false;
      if (attempts >= MAX_TRANSLATION_ATTEMPTS) return false;
      if (!report.translation_next_retry_at) return true;
      return new Date(report.translation_next_retry_at).getTime() <= Date.now();
    })
    .slice(0, batchSize);

  let processed = 0;
  let completed = 0;
  let skipped = 0;
  let failed = 0;
  let claimed = 0;

  await runWithConcurrency(eligible, MAX_CONCURRENCY, async (report: any) => {
    const nextAttempt = Number(report.translation_attempts ?? 0) + 1;
    const claimQuery = workerAuth.supabase
      .from("hazard_reports")
      .update({
        translation_status: "processing",
        translation_attempts: nextAttempt,
        translation_last_attempt_at: nowIso,
        translation_last_error: null,
        translation_next_retry_at: null,
      })
      .eq("id", report.id)
      .eq("translation_status", report.translation_status ?? "pending")
      .eq("translation_attempts", Number(report.translation_attempts ?? 0))
      .select("id, description")
      .maybeSingle();

    const { data: claimedReport, error: claimError } = await claimQuery;
    if (claimError || !claimedReport) {
      return;
    }

    claimed += 1;

    try {
      const outcome = await translateReportDescription(String(claimedReport.description ?? ""));
      const { error: updateError } = await workerAuth.supabase
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
        .eq("id", claimedReport.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      processed += 1;
      if (outcome.status === "completed") completed += 1;
      if (outcome.status === "skipped") skipped += 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to translate report";
      const retryAllowed = nextAttempt < MAX_TRANSLATION_ATTEMPTS;
      await workerAuth.supabase
        .from("hazard_reports")
        .update({
          translation_status: "failed",
          translation_last_error: errorMessage,
          translation_next_retry_at: retryAllowed ? computeNextRetryAt(nextAttempt) : null,
        })
        .eq("id", claimedReport.id);
      processed += 1;
      failed += 1;
    }
  });

  return jsonResponse({
    claimed,
    processed,
    completed,
    skipped,
    failed,
    batch_size: batchSize,
  });
});
