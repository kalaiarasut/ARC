/// <reference path="../types.d.ts" />

import {
  handleCors,
  jsonResponse,
  requireWorkerSecret,
} from "../_shared_admin.ts";
import {
  processPendingAiBatch,
} from "../_report_ai.ts";

const parseIntOr = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
};

const DEFAULT_BATCH_SIZE = parseIntOr(Deno.env.get("REPORT_AI_BATCH_SIZE"), 10);
const MAX_BATCH_SIZE = parseIntOr(Deno.env.get("REPORT_AI_MAX_BATCH_SIZE"), 30);
const DEFAULT_CONCURRENCY = parseIntOr(Deno.env.get("REPORT_AI_CONCURRENCY"), 2);
const MAX_CONCURRENCY = parseIntOr(Deno.env.get("REPORT_AI_MAX_CONCURRENCY"), 4);

const clampPositiveInt = (value: number, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
};

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const workerAuth = await requireWorkerSecret(request, "REPORT_AI_WORKER_SECRET");
  if (workerAuth instanceof Response) return workerAuth;

  const payload = await request.json().catch(() => null);
  const requestedLimit = Number(payload?.limit ?? DEFAULT_BATCH_SIZE);
  const requestedConcurrency = Number(payload?.concurrency ?? DEFAULT_CONCURRENCY);
  const batchSize = clampPositiveInt(requestedLimit, 1, MAX_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const concurrency = clampPositiveInt(requestedConcurrency, 1, MAX_CONCURRENCY, DEFAULT_CONCURRENCY);
  try {
    const result = await processPendingAiBatch(workerAuth.supabase, batchSize, concurrency);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to process pending AI analysis" },
      500,
    );
  }
});
