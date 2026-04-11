const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_BASE_URL = (Deno.env.get("GROQ_BASE_URL") ?? DEFAULT_GROQ_BASE_URL).trim().replace(/\/+$/, "");
const GROQ_API_KEY = (Deno.env.get("GROQ_API_KEY") ?? "").trim();
const GROQ_TEXT_MODEL = (Deno.env.get("REPORT_AI_TEXT_MODEL") ?? "qwen/qwen3-32b").trim();
const GROQ_VISION_MODEL = (Deno.env.get("REPORT_AI_VISION_MODEL") ?? "meta-llama/llama-4-scout-17b-16e-instruct").trim();
const GROQ_TRANSCRIPTION_MODEL = (Deno.env.get("REPORT_AI_TRANSCRIPTION_MODEL") ?? "whisper-large-v3-turbo").trim();
const MAX_IMAGE_INPUTS = Math.max(1, Math.min(5, Number(Deno.env.get("REPORT_AI_MAX_IMAGES") ?? "3")));
const MAX_AUDIO_INPUTS = Math.max(1, Math.min(3, Number(Deno.env.get("REPORT_AI_MAX_AUDIO") ?? "2")));
const MAX_VIDEO_INPUTS = Math.max(1, Math.min(2, Number(Deno.env.get("REPORT_AI_MAX_VIDEO") ?? "1")));

export const MAX_ANALYSIS_ATTEMPTS = 3;

type ImmediateDangerStatus = "yes" | "no" | "not_sure";
type AffectedPeopleBand = "unknown" | "1_5" | "6_20" | "21_50" | "50_plus";
type ScoreBucket = "critical" | "high" | "medium" | "low";
type AnalysisStatus = "pending" | "processing" | "completed" | "partial" | "failed";
type ReportStatus = "pending" | "verified" | "rejected" | "resolved";

type TextAnalysisResult = {
  summary: string;
  score: number;
  confidence: number;
  recommendedAction: string | null;
  recommendedStatus: ReportStatus | null;
  extractedSignals: Record<string, unknown>;
  reasons: string[];
};

type VisionAnalysisResult = {
  summary: string;
  score: number;
  confidence: number;
  visibleSignals: Record<string, unknown>;
  reasons: string[];
};

type TranscriptEvidence = {
  url: string;
  transcript: string;
  score: number;
  confidence: number;
  summary: string;
  reasons: string[];
  extractedSignals: Record<string, unknown>;
};

export type ReportRecord = {
  id: string;
  hazard_type: string | null;
  description: string | null;
  translated_english: string | null;
  translation_status: string | null;
  urgency_level: string | null;
  is_high_risk: boolean | null;
  people_at_risk: number | null;
  immediate_danger_status: string | null;
  affected_people_band: string | null;
  media_urls: string[] | null;
  upload_complete: boolean | null;
  event_time: string | null;
  created_at: string | null;
};

export type CompletedAnalysis = {
  analysis_status: AnalysisStatus;
  operational_score: number;
  score_bucket: ScoreBucket;
  text_score: number;
  image_score: number;
  audio_score: number;
  video_score: number;
  metadata_score: number;
  confidence_score: number;
  recommended_action: string;
  recommended_status: ReportStatus | null;
  summary: string;
  extracted_signals_json: Record<string, unknown>;
  scoring_reasons_json: string[];
  media_evidence_json: Record<string, unknown>;
  processed_modalities_json: Record<string, boolean>;
  provider_primary: string | null;
  model_primary: string | null;
  provider_fallback: string | null;
  model_fallback: string | null;
  analyzed_at: string;
};

export type PendingAiBatchResult = {
  claimed: number;
  processed: number;
  completed: number;
  partial: number;
  failed: number;
  batch_size: number;
  concurrency: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeText = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim();

const truncateText = (value: string | null | undefined, max = 400) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trim()}…`;
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const normalizeMediaPath = (value: string) =>
  value.toLowerCase().split("?")[0]?.split("#")[0] ?? value.toLowerCase();

const looksImage = (url: string) => {
  const lower = normalizeMediaPath(url);
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp") || lower.endsWith(".heic");
};

const looksAudio = (url: string) => {
  const lower = normalizeMediaPath(url);
  return lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".m4a") || lower.endsWith(".aac") || lower.endsWith(".ogg") || lower.endsWith(".opus");
};

const looksVideo = (url: string) => {
  const lower = normalizeMediaPath(url);
  return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || lower.endsWith(".mkv") || lower.endsWith(".ogv");
};

const urgencyScore = (value: string | null) => {
  switch ((value ?? "").toLowerCase()) {
    case "high":
      return 22;
    case "medium":
      return 14;
    case "low":
      return 6;
    default:
      return 0;
  }
};

const immediateDangerScore = (value: string | null) => {
  switch ((value ?? "").toLowerCase() as ImmediateDangerStatus) {
    case "yes":
      return 25;
    case "not_sure":
      return 10;
    default:
      return 0;
  }
};

const affectedBandScore = (value: string | null) => {
  switch ((value ?? "").toLowerCase() as AffectedPeopleBand) {
    case "1_5":
      return 8;
    case "6_20":
      return 14;
    case "21_50":
      return 20;
    case "50_plus":
      return 26;
    default:
      return 0;
  }
};

const peopleAtRiskScore = (value: number | null) => {
  if (!Number.isFinite(value) || value == null || value <= 0) return 0;
  if (value >= 50) return 16;
  if (value >= 20) return 12;
  if (value >= 6) return 8;
  return 4;
};

const recencyScore = (createdAt: string | null, eventTime: string | null) => {
  const reference = eventTime ?? createdAt;
  if (!reference) return 0;
  const ageMs = Date.now() - new Date(reference).getTime();
  if (!Number.isFinite(ageMs)) return 0;
  if (ageMs <= 30 * 60_000) return 12;
  if (ageMs <= 2 * 60 * 60_000) return 8;
  if (ageMs <= 12 * 60 * 60_000) return 4;
  return 0;
};

const computeMediaCounts = (urls: string[] | null | undefined) => {
  const values = Array.isArray(urls) ? urls.filter((item) => typeof item === "string" && item.trim().length > 0) : [];
  let images = 0;
  let audio = 0;
  let video = 0;
  for (const value of values) {
    if (looksImage(value)) images += 1;
    else if (looksAudio(value)) audio += 1;
    else if (looksVideo(value)) video += 1;
  }
  return { total: values.length, images, audio, video };
};

const computeMetadataScore = (report: ReportRecord) => {
  const media = computeMediaCounts(report.media_urls);
  const metadataScore = clamp(
    urgencyScore(report.urgency_level) +
      immediateDangerScore(report.immediate_danger_status) +
      affectedBandScore(report.affected_people_band) +
      peopleAtRiskScore(report.people_at_risk) +
      (report.is_high_risk ? 10 : 0) +
      recencyScore(report.created_at, report.event_time) +
      Math.min(media.images * 4, 8) +
      Math.min(media.audio * 5, 5) +
      Math.min(media.video * 8, 8) +
      (report.upload_complete ? 3 : 0),
    0,
    100,
  );

  return { metadataScore, media };
};

const toScoreBucket = (score: number): ScoreBucket => {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
};

const defaultActionForBucket = (bucket: ScoreBucket) => {
  switch (bucket) {
    case "critical":
      return "Review immediately and validate the report with highest urgency.";
    case "high":
      return "Prioritize this report near the top of the admin queue.";
    case "medium":
      return "Keep this in the standard review queue.";
    case "low":
    default:
      return "Review after higher-priority reports unless new evidence arrives.";
  }
};

const safeRecommendedStatus = (value: unknown): ReportStatus | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "pending" || normalized === "verified" || normalized === "rejected" || normalized === "resolved") {
    return normalized as ReportStatus;
  }
  return null;
};

const parseModelJson = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const mergeSignals = (...sources: Array<Record<string, unknown> | null | undefined>) => {
  const merged: Record<string, unknown> = {};
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "boolean") {
        merged[key] = Boolean(merged[key]) || value;
      } else if (Array.isArray(value)) {
        const current = Array.isArray(merged[key]) ? merged[key] as unknown[] : [];
        merged[key] = [...current, ...value].slice(0, 8);
      } else if (value != null && !(key in merged)) {
        merged[key] = value;
      }
    }
  }
  return merged;
};

const appendReasons = (base: string[], additions: string[]) => {
  for (const reason of additions) {
    const normalized = normalizeText(reason);
    if (!normalized) continue;
    if (!base.includes(normalized)) {
      base.push(normalized);
    }
  }
};

const postGroqJson = async (path: string, payload: Record<string, unknown>) => {
  const response = await fetch(`${GROQ_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      result?.error?.message ??
      result?.message ??
      `Groq request failed (${response.status})`;
    throw new Error(message);
  }

  return result;
};

const postGroqMultipart = async (path: string, form: FormData) => {
  const response = await fetch(`${GROQ_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: form,
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      result?.error?.message ??
      result?.message ??
      `Groq request failed (${response.status})`;
    throw new Error(message);
  }

  return result;
};

const buildTextPromptPayload = (task: string, report: ReportRecord, text: string, metadataScore: number, media: ReturnType<typeof computeMediaCounts>) => ({
  task,
  constraints: {
    score_range: "0-100",
    confidence_score_range: "0-1",
    allowed_recommended_status: ["pending", "verified", "rejected", "resolved", null],
    max_summary_words: 40,
    max_reasons: 4,
  },
  report: {
    hazard_type: report.hazard_type,
    text,
    urgency_level: report.urgency_level,
    is_high_risk: Boolean(report.is_high_risk),
    people_at_risk: report.people_at_risk,
    immediate_danger_status: report.immediate_danger_status,
    affected_people_band: report.affected_people_band,
    created_at: report.created_at,
    event_time: report.event_time,
    media_counts: media,
    metadata_score: metadataScore,
  },
});

const callGroqTextAnalysis = async (report: ReportRecord, text: string, metadataScore: number, media: ReturnType<typeof computeMediaCounts>, task: string) => {
  if (!GROQ_API_KEY || !text) {
    return null;
  }

  const payload = {
    model: GROQ_TEXT_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You score hazard report evidence for an admin operations queue. Return strict JSON only. Keep summaries short and operational. Never invent unseen facts.",
      },
      {
        role: "user",
        content: JSON.stringify({
          ...buildTextPromptPayload(task, report, text, metadataScore, media),
          output_schema: {
            summary: "string",
            score: "number",
            confidence_score: "number",
            recommended_action: "string|null",
            recommended_status: "pending|verified|rejected|resolved|null",
            extracted_signals: {
              people_in_danger: "boolean",
              blocked_access: "boolean",
              infrastructure_damage: "boolean",
              flooding_or_overtopping: "boolean",
              uncertainty: "boolean",
            },
            score_reasons: ["string"],
          },
        }),
      },
    ],
  };

  const result = await postGroqJson("/chat/completions", payload);
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq returned empty text analysis content");
  }

  const parsed = parseModelJson(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Groq returned invalid text analysis JSON");
  }

  return {
    summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "No summary returned.",
    score: clamp(Number(parsed.score ?? parsed.text_score ?? 0), 0, 100),
    confidence: clamp(Number(parsed.confidence_score ?? 0), 0, 1),
    recommendedAction: typeof parsed.recommended_action === "string" && parsed.recommended_action.trim()
      ? parsed.recommended_action.trim()
      : null,
    recommendedStatus: safeRecommendedStatus(parsed.recommended_status),
    extractedSignals: parsed.extracted_signals && typeof parsed.extracted_signals === "object"
      ? parsed.extracted_signals as Record<string, unknown>
      : {},
    reasons: Array.isArray(parsed.score_reasons)
      ? parsed.score_reasons.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 4)
      : [],
  } satisfies TextAnalysisResult;
};

const callGroqVisionAnalysis = async (report: ReportRecord, imageUrls: string[], metadataScore: number, media: ReturnType<typeof computeMediaCounts>) => {
  if (!GROQ_API_KEY || imageUrls.length === 0) {
    return null;
  }

  const payload = {
    model: GROQ_VISION_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_completion_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You assess hazard evidence visible in citizen-submitted images for emergency operations. Return strict JSON only. Never guess hidden facts.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              task: "Analyze these report images and estimate how strongly they raise the admin review priority.",
              report: {
                hazard_type: report.hazard_type,
                translated_english: truncateText(report.translated_english || report.description, 300),
                urgency_level: report.urgency_level,
                metadata_score: metadataScore,
                media_counts: media,
              },
              output_schema: {
                summary: "string",
                image_score: "number",
                confidence_score: "number",
                visible_signals: {
                  visible_people_exposed: "boolean",
                  deep_or_fast_water: "boolean",
                  blocked_access: "boolean",
                  infrastructure_damage: "boolean",
                  low_visibility_or_uncertainty: "boolean",
                },
                score_reasons: ["string"],
              },
            }),
          },
          ...imageUrls.map((url) => ({
            type: "image_url",
            image_url: { url },
          })),
        ],
      },
    ],
  };

  const result = await postGroqJson("/chat/completions", payload);
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq returned empty vision analysis content");
  }

  const parsed = parseModelJson(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Groq returned invalid vision analysis JSON");
  }

  return {
    summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "No image summary returned.",
    score: clamp(Number(parsed.image_score ?? parsed.score ?? 0), 0, 100),
    confidence: clamp(Number(parsed.confidence_score ?? 0), 0, 1),
    visibleSignals: parsed.visible_signals && typeof parsed.visible_signals === "object"
      ? parsed.visible_signals as Record<string, unknown>
      : {},
    reasons: Array.isArray(parsed.score_reasons)
      ? parsed.score_reasons.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 4)
      : [],
  } satisfies VisionAnalysisResult;
};

const transcribeMediaToEnglish = async (url: string) => {
  if (!GROQ_API_KEY) {
    return "";
  }

  const form = new FormData();
  form.append("model", GROQ_TRANSCRIPTION_MODEL);
  form.append("url", url);
  form.append("response_format", "json");

  const result = await postGroqMultipart("/audio/translations", form);
  return typeof result?.text === "string" ? normalizeText(result.text) : "";
};

const analyzeTranscriptEvidence = async (
  report: ReportRecord,
  transcript: string,
  metadataScore: number,
  media: ReturnType<typeof computeMediaCounts>,
  modality: "audio" | "video",
  url: string,
): Promise<TranscriptEvidence | null> => {
  if (!transcript) return null;

  const analysis = await callGroqTextAnalysis(
    report,
    transcript,
    metadataScore,
    media,
    `Assess ${modality} transcript evidence for this hazard report.`,
  );

  if (!analysis) return null;

  return {
    url,
    transcript,
    score: analysis.score,
    confidence: analysis.confidence,
    summary: analysis.summary,
    reasons: analysis.reasons,
    extractedSignals: analysis.extractedSignals,
  };
};

export const computeNextRetryAt = (attempts: number) => {
  const backoffMinutes = attempts >= 3 ? 60 : attempts === 2 ? 15 : 5;
  return new Date(Date.now() + backoffMinutes * 60_000).toISOString();
};

export const selectReportForAi = async (supabase: any, reportId: string): Promise<ReportRecord> => {
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
      created_at
    `)
    .eq("id", reportId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Report not found");
  }

  return data as ReportRecord;
};

export const persistAiAnalysis = async (
  supabase: any,
  reportId: string,
  completed: CompletedAnalysis,
  runKind: "base" | "media" | "manual_retry" | "scheduled",
) => {
  const { error: updateError } = await supabase
    .from("report_ai_analysis")
    .upsert({
      report_id: reportId,
      ...completed,
      last_error: null,
      next_retry_at: null,
      needs_recompute: false,
    });

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: runError } = await supabase
    .from("report_ai_runs")
    .insert({
      report_id: reportId,
      run_kind: runKind,
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

  if (runError) {
    throw new Error(runError.message);
  }
};

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

export const processPendingAiBatch = async (
  supabase: any,
  batchSize: number,
  concurrency: number,
): Promise<PendingAiBatchResult> => {
  const nowIso = new Date().toISOString();

  const { data: candidateRows, error: candidateError } = await supabase
    .from("report_ai_analysis")
    .select("report_id, analysis_status, analysis_attempts, next_retry_at, needs_recompute, updated_at")
    .in("analysis_status", ["pending", "failed", "partial"])
    .order("updated_at", { ascending: true })
    .limit(batchSize * 5);

  if (candidateError) {
    throw new Error(candidateError.message);
  }

  const eligible = (candidateRows ?? [])
    .filter((row: any) => {
      const status = String(row.analysis_status ?? "pending");
      const attempts = Number(row.analysis_attempts ?? 0);
      if (attempts >= MAX_ANALYSIS_ATTEMPTS) return false;
      if (status === "pending") return true;
      if (status === "partial" && row.needs_recompute === true) return true;
      if (status !== "failed") return false;
      if (!row.next_retry_at) return true;
      return new Date(row.next_retry_at).getTime() <= Date.now();
    })
    .slice(0, batchSize);

  const reportIds = eligible.map((row: any) => String(row.report_id ?? "")).filter(Boolean);
  if (reportIds.length === 0) {
    return {
      claimed: 0,
      processed: 0,
      completed: 0,
      partial: 0,
      failed: 0,
      batch_size: batchSize,
      concurrency,
    };
  }

  const { data: reportRows, error: reportError } = await supabase
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
      created_at
    `)
    .in("id", reportIds);

  if (reportError) {
    throw new Error(reportError.message);
  }

  const reportMap = new Map<string, ReportRecord>();
  for (const row of (reportRows ?? [])) {
    reportMap.set(String(row.id), row as ReportRecord);
  }

  let claimed = 0;
  let processed = 0;
  let completed = 0;
  let partial = 0;
  let failed = 0;

  await runWithConcurrency(eligible, concurrency, async (row: any) => {
    const reportId = String(row.report_id ?? "");
    const report = reportMap.get(reportId);
    if (!report) return;

    const translationStatus = String(report.translation_status ?? "pending");
    if (translationStatus !== "completed" && translationStatus !== "skipped") {
      return;
    }

    const nextAttempt = Number(row.analysis_attempts ?? 0) + 1;
    const { data: claimedRow, error: claimError } = await supabase
      .from("report_ai_analysis")
      .update({
        analysis_status: "processing",
        analysis_attempts: nextAttempt,
        last_attempt_at: nowIso,
        last_error: null,
        next_retry_at: null,
        needs_recompute: false,
      })
      .eq("report_id", reportId)
      .eq("analysis_status", row.analysis_status ?? "pending")
      .eq("analysis_attempts", Number(row.analysis_attempts ?? 0))
      .select("report_id")
      .maybeSingle();

    if (claimError || !claimedRow) {
      return;
    }

    claimed += 1;

    try {
      const result = await buildCompletedAnalysis(report);
      const { error: updateError } = await supabase
        .from("report_ai_analysis")
        .update({
          ...result,
          last_error: null,
          next_retry_at: null,
          needs_recompute: false,
        })
        .eq("report_id", reportId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await supabase.from("report_ai_runs").insert({
        report_id: reportId,
        run_kind: "scheduled",
        status: result.analysis_status === "completed" ? "completed" : "partial",
        provider_primary: result.provider_primary,
        model_primary: result.model_primary,
        provider_fallback: result.provider_fallback,
        model_fallback: result.model_fallback,
        prompt_version: "report-ai-v1",
        summary: result.summary,
        score_snapshot: result.operational_score,
        metadata_json: {
          bucket: result.score_bucket,
          confidence_score: result.confidence_score,
          processed_modalities_json: result.processed_modalities_json,
        },
      });

      processed += 1;
      if (result.analysis_status === "completed") completed += 1;
      else partial += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze report";
      const retryAllowed = nextAttempt < MAX_ANALYSIS_ATTEMPTS;

      await supabase
        .from("report_ai_analysis")
        .update({
          analysis_status: "failed",
          last_error: message,
          next_retry_at: retryAllowed ? computeNextRetryAt(nextAttempt) : null,
          needs_recompute: retryAllowed,
        })
        .eq("report_id", reportId);

      await supabase.from("report_ai_runs").insert({
        report_id: reportId,
        run_kind: "scheduled",
        status: "failed",
        prompt_version: "report-ai-v1",
        error_text: message,
        metadata_json: {
          attempt: nextAttempt,
        },
      });

      processed += 1;
      failed += 1;
    }
  });

  return {
    claimed,
    processed,
    completed,
    partial,
    failed,
    batch_size: batchSize,
    concurrency,
  };
};

export const buildCompletedAnalysis = async (report: ReportRecord): Promise<CompletedAnalysis> => {
  const { metadataScore, media } = computeMetadataScore(report);
  const imageUrls = (report.media_urls ?? []).filter((url) => typeof url === "string" && looksImage(url)).slice(0, MAX_IMAGE_INPUTS);
  const audioUrls = (report.media_urls ?? []).filter((url) => typeof url === "string" && looksAudio(url)).slice(0, MAX_AUDIO_INPUTS);
  const videoUrls = (report.media_urls ?? []).filter((url) => typeof url === "string" && looksVideo(url)).slice(0, MAX_VIDEO_INPUTS);
  const normalizedText = normalizeText(report.translated_english) || normalizeText(report.description);

  const scoringReasons: string[] = [];
  if ((report.immediate_danger_status ?? "").toLowerCase() === "yes") scoringReasons.push("Reporter marked immediate danger.");
  if ((report.urgency_level ?? "").toLowerCase() === "high") scoringReasons.push("Reporter marked high urgency.");
  if (media.video > 0) scoringReasons.push("Video evidence attached.");
  else if (media.images > 0) scoringReasons.push("Photo evidence attached.");
  else if (media.audio > 0) scoringReasons.push("Audio evidence attached.");

  let textScore = normalizedText ? clamp(Math.round(metadataScore * 0.8), 0, 100) : 0;
  let imageScore = 0;
  let audioScore = 0;
  let videoScore = 0;
  let confidenceScore = normalizedText ? 0.45 : 0.2;
  let recommendedAction = defaultActionForBucket(toScoreBucket(metadataScore));
  let recommendedStatus: ReportStatus | null = null;
  let summary = normalizedText
    ? `Citizen report for ${report.hazard_type ?? "hazard"} awaiting AI triage.`
    : "Awaiting translated report text for richer AI analysis.";
  let extractedSignals: Record<string, unknown> = {
    people_in_danger: (report.immediate_danger_status ?? "").toLowerCase() === "yes",
    blocked_access: false,
    infrastructure_damage: false,
    flooding_or_overtopping: false,
    uncertainty: !normalizedText,
  };
  let analysisStatus: AnalysisStatus = "partial";
  let providerPrimary: string | null = null;
  let modelPrimary: string | null = null;
  let providerFallback: string | null = null;
  let modelFallback: string | null = null;

  const mediaEvidence: Record<string, unknown> = {
    image_count: media.images,
    audio_count: media.audio,
    video_count: media.video,
    image_analysis_status: imageUrls.length > 0 ? "pending" : "not_applicable",
    audio_analysis_status: audioUrls.length > 0 ? "pending" : "not_applicable",
    video_analysis_status: videoUrls.length > 0 ? "pending" : "not_applicable",
    image_summaries: [] as string[],
    audio_transcripts: [] as string[],
    audio_summaries: [] as string[],
    video_transcripts: [] as string[],
    video_summaries: [] as string[],
  };

  const processedModalities = {
    metadata: true,
    text: false,
    image: false,
    audio: false,
    video: false,
  };

  const presentWeights: Array<{ score: number; weight: number }> = [
    { score: metadataScore, weight: 0.35 },
  ];

  if (normalizedText && GROQ_API_KEY) {
    try {
      const textResult = await callGroqTextAnalysis(
        report,
        normalizedText,
        metadataScore,
        media,
        "Score this report for admin queue priority.",
      );
      if (textResult) {
        textScore = textResult.score;
        confidenceScore = Math.max(confidenceScore, textResult.confidence);
        if (textResult.recommendedAction) recommendedAction = textResult.recommendedAction;
        recommendedStatus = textResult.recommendedStatus;
        summary = textResult.summary;
        extractedSignals = mergeSignals(extractedSignals, textResult.extractedSignals);
        appendReasons(scoringReasons, textResult.reasons);
        processedModalities.text = true;
        providerPrimary = "groq";
        modelPrimary = GROQ_TEXT_MODEL;
        presentWeights.push({ score: textScore, weight: 0.35 });
      }
    } catch (error) {
      appendReasons(scoringReasons, [`AI text analysis fallback: ${error instanceof Error ? error.message : "Failed"}`]);
    }
  }

  if (imageUrls.length > 0 && GROQ_API_KEY) {
    try {
      const visionResult = await callGroqVisionAnalysis(report, imageUrls, metadataScore, media);
      if (visionResult) {
        imageScore = visionResult.score;
        confidenceScore = Math.max(confidenceScore, visionResult.confidence);
        extractedSignals = mergeSignals(extractedSignals, visionResult.visibleSignals);
        appendReasons(scoringReasons, visionResult.reasons);
        (mediaEvidence.image_summaries as string[]).push(visionResult.summary);
        mediaEvidence.image_analysis_status = "completed";
        processedModalities.image = true;
        providerFallback = "groq";
        modelFallback = GROQ_VISION_MODEL;
        presentWeights.push({ score: imageScore, weight: 0.15 });
      }
    } catch (error) {
      mediaEvidence.image_analysis_status = "failed";
      mediaEvidence.image_last_error = error instanceof Error ? error.message : "Image analysis failed";
      appendReasons(scoringReasons, [`Image analysis unavailable: ${error instanceof Error ? error.message : "Failed"}`]);
    }
  }

  for (const url of audioUrls) {
    if (!GROQ_API_KEY) break;
    try {
      const transcript = await transcribeMediaToEnglish(url);
      if (!transcript) continue;
      const transcriptResult = await analyzeTranscriptEvidence(report, transcript, metadataScore, media, "audio", url);
      (mediaEvidence.audio_transcripts as string[]).push(truncateText(transcript, 220));
      if (transcriptResult) {
        audioScore = Math.max(audioScore, transcriptResult.score);
        confidenceScore = Math.max(confidenceScore, transcriptResult.confidence);
        extractedSignals = mergeSignals(extractedSignals, transcriptResult.extractedSignals);
        appendReasons(scoringReasons, transcriptResult.reasons);
        (mediaEvidence.audio_summaries as string[]).push(transcriptResult.summary);
      }
      mediaEvidence.audio_analysis_status = "completed";
      processedModalities.audio = true;
    } catch (error) {
      mediaEvidence.audio_analysis_status = "failed";
      mediaEvidence.audio_last_error = error instanceof Error ? error.message : "Audio analysis failed";
      appendReasons(scoringReasons, [`Audio analysis unavailable: ${error instanceof Error ? error.message : "Failed"}`]);
    }
  }

  if (processedModalities.audio && audioScore > 0) {
    presentWeights.push({ score: audioScore, weight: 0.075 });
  }

  for (const url of videoUrls) {
    if (!GROQ_API_KEY) break;
    try {
      const transcript = await transcribeMediaToEnglish(url);
      if (!transcript) continue;
      const transcriptResult = await analyzeTranscriptEvidence(report, transcript, metadataScore, media, "video", url);
      (mediaEvidence.video_transcripts as string[]).push(truncateText(transcript, 220));
      if (transcriptResult) {
        videoScore = Math.max(videoScore, transcriptResult.score);
        confidenceScore = Math.max(confidenceScore, transcriptResult.confidence);
        extractedSignals = mergeSignals(extractedSignals, transcriptResult.extractedSignals);
        appendReasons(scoringReasons, transcriptResult.reasons);
        (mediaEvidence.video_summaries as string[]).push(transcriptResult.summary);
      }
      mediaEvidence.video_analysis_status = "completed_audio_track";
      processedModalities.video = true;
    } catch (error) {
      mediaEvidence.video_analysis_status = "failed";
      mediaEvidence.video_last_error = error instanceof Error ? error.message : "Video analysis failed";
      appendReasons(scoringReasons, [`Video audio analysis unavailable: ${error instanceof Error ? error.message : "Failed"}`]);
    }
  }

  if (processedModalities.video && videoScore > 0) {
    presentWeights.push({ score: videoScore, weight: 0.075 });
  }

  if (processedModalities.text && processedModalities.image && (audioUrls.length === 0 || processedModalities.audio || mediaEvidence.audio_analysis_status === "failed") && (videoUrls.length === 0 || processedModalities.video || mediaEvidence.video_analysis_status === "failed")) {
    analysisStatus = mediaEvidence.image_analysis_status === "failed" || mediaEvidence.audio_analysis_status === "failed" || mediaEvidence.video_analysis_status === "failed"
      ? "partial"
      : "completed";
  } else if (processedModalities.text || processedModalities.image || processedModalities.audio || processedModalities.video) {
    analysisStatus = "partial";
  }

  const weightedScore =
    presentWeights.reduce((sum, item) => sum + item.score * item.weight, 0) /
    Math.max(1, presentWeights.reduce((sum, item) => sum + item.weight, 0));
  const operationalScore = clamp(Math.round(weightedScore), 0, 100);
  const scoreBucket = toScoreBucket(operationalScore);

  const mediaSummaryParts = [
    ...(mediaEvidence.image_summaries as string[]),
    ...(mediaEvidence.audio_summaries as string[]),
    ...(mediaEvidence.video_summaries as string[]),
  ].filter(Boolean);

  if (mediaSummaryParts.length > 0) {
    summary = `${summary} ${mediaSummaryParts.slice(0, 2).join(" ")}`.trim();
  }

  if (!recommendedAction) {
    recommendedAction = defaultActionForBucket(scoreBucket);
  }

  return {
    analysis_status: analysisStatus,
    operational_score: operationalScore,
    score_bucket: scoreBucket,
    text_score: textScore,
    image_score: imageScore,
    audio_score: audioScore,
    video_score: videoScore,
    metadata_score: metadataScore,
    confidence_score: Number(clamp(confidenceScore, 0, 1).toFixed(3)),
    recommended_action: recommendedAction,
    recommended_status: recommendedStatus,
    summary,
    extracted_signals_json: extractedSignals,
    scoring_reasons_json: scoringReasons.slice(0, 6),
    media_evidence_json: mediaEvidence,
    processed_modalities_json: processedModalities,
    provider_primary: providerPrimary ?? (GROQ_API_KEY ? "groq" : null),
    model_primary: modelPrimary ?? (GROQ_API_KEY ? GROQ_TEXT_MODEL : null),
    provider_fallback: providerFallback,
    model_fallback: modelFallback,
    analyzed_at: new Date().toISOString(),
  };
};
