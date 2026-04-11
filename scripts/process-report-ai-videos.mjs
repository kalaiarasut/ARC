import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawn } from "node:child_process";

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY ?? "").trim();
const GROQ_BASE_URL = (process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1").trim().replace(/\/+$/, "");
const GROQ_VISION_MODEL = (process.env.REPORT_AI_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct").trim();
const VIDEO_FRAME_COUNT = Math.max(2, Math.min(5, Number(process.env.REPORT_AI_VIDEO_FRAME_COUNT ?? "3")));
const MAX_REPORTS = Math.max(1, Math.min(20, Number(process.env.REPORT_AI_VIDEO_WORKER_LIMIT ?? "5")));
const FFMPEG_PATH = (process.env.REPORT_AI_FFMPEG_PATH ?? "ffmpeg").trim();
const FFPROBE_PATH = (process.env.REPORT_AI_FFPROBE_PATH ?? "ffprobe").trim();
const TMP_PREFIX = "report-ai-video-";

const required = [
  ["SUPABASE_URL", SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY],
  ["GROQ_API_KEY", GROQ_API_KEY],
];

for (const [name, value] of required) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

const apiHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const truncateText = (value, max = 240) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  return normalized.length <= max ? normalized : `${normalized.slice(0, Math.max(0, max - 1)).trim()}...`;
};

const looksVideo = (value) => {
  const lower = String(value ?? "").toLowerCase().split("?")[0].split("#")[0];
  return [".mp4", ".mov", ".webm", ".mkv", ".ogv"].some((suffix) => lower.endsWith(suffix));
};

const parseJsonMaybe = (value) => {
  const text = normalizeText(value);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const spawnAndCollect = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} exited with code ${code}: ${stderr || stdout}`));
      }
    });
  });

const getVideoDurationSeconds = async (inputPath) => {
  const { stdout } = await spawnAndCollect(FFPROBE_PATH, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]);
  const duration = Number(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not determine video duration");
  }
  return duration;
};

const extractFrames = async (videoPath, workdir) => {
  const duration = await getVideoDurationSeconds(videoPath);
  const framePaths = [];
  const fractions = Array.from({ length: VIDEO_FRAME_COUNT }, (_, index) => (index + 1) / (VIDEO_FRAME_COUNT + 1));

  for (let index = 0; index < fractions.length; index += 1) {
    const seconds = Math.max(0, Math.min(duration - 0.25, duration * fractions[index]));
    const outputPath = join(workdir, `frame-${index + 1}.jpg`);
    await spawnAndCollect(FFMPEG_PATH, [
      "-y",
      "-ss",
      seconds.toFixed(2),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      outputPath,
    ]);
    framePaths.push(outputPath);
  }

  return framePaths;
};

const fileToDataUrl = async (filePath) => {
  const buffer = await readFile(filePath);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message ?? payload?.error?.message ?? payload?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

const fetchCandidateReports = async () => {
  const url = new URL(`${SUPABASE_URL}/rest/v1/hazard_reports`);
  url.searchParams.set("select", [
    "id",
    "hazard_type",
    "description",
    "translated_english",
    "translation_status",
    "urgency_level",
    "is_high_risk",
    "people_at_risk",
    "immediate_danger_status",
    "affected_people_band",
    "media_urls",
    "upload_complete",
    "event_time",
    "created_at",
    "ai_analysis:report_ai_analysis(*)",
  ].join(","));
  url.searchParams.set("translation_status", "in.(completed,skipped)");
  url.searchParams.set("limit", String(MAX_REPORTS * 4));
  url.searchParams.set("order", "created_at.desc");

  const rows = await fetchJson(url.toString(), { headers: apiHeaders });
  return rows
    .map((row) => ({
      ...row,
      ai_analysis: Array.isArray(row.ai_analysis) ? (row.ai_analysis[0] ?? null) : row.ai_analysis,
    }))
    .filter((row) => {
      const mediaUrls = Array.isArray(row.media_urls) ? row.media_urls : [];
      const hasVideo = mediaUrls.some(looksVideo);
      if (!hasVideo) return false;

      const mediaEvidence = row.ai_analysis?.media_evidence_json ?? {};
      const frameStatus = mediaEvidence?.video_frame_analysis_status ?? null;
      const videoStatus = mediaEvidence?.video_analysis_status ?? null;
      return frameStatus !== "completed" && videoStatus !== "failed";
    })
    .slice(0, MAX_REPORTS);
};

const analyzeVideoFrames = async (report, frameDataUrls) => {
  const mediaCounts = {
    total: Array.isArray(report.media_urls) ? report.media_urls.length : 0,
    video: (report.media_urls ?? []).filter(looksVideo).length,
  };

  const payload = {
    model: GROQ_VISION_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_completion_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You assess hazard evidence visible in extracted video frames for emergency operations. Return strict JSON only. Never guess hidden facts.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              task: "Analyze these extracted frames from a citizen hazard video and estimate how strongly they raise admin review priority.",
              report: {
                hazard_type: report.hazard_type,
                translated_english: truncateText(report.translated_english || report.description, 300),
                urgency_level: report.urgency_level,
                is_high_risk: Boolean(report.is_high_risk),
                media_counts: mediaCounts,
              },
              output_schema: {
                summary: "string",
                video_frame_score: "number",
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
          ...frameDataUrls.map((url) => ({
            type: "image_url",
            image_url: { url },
          })),
        ],
      },
    ],
  };

  const result = await fetchJson(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const content = result?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq returned empty video-frame analysis content");
  }

  const parsed = parseJsonMaybe(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Groq returned invalid video-frame analysis JSON");
  }

  return {
    summary: normalizeText(parsed.summary) || "No frame summary returned.",
    score: Math.max(0, Math.min(100, Number(parsed.video_frame_score ?? parsed.score ?? 0))),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence_score ?? 0))),
    visibleSignals: parsed.visible_signals && typeof parsed.visible_signals === "object" ? parsed.visible_signals : {},
    reasons: Array.isArray(parsed.score_reasons)
      ? parsed.score_reasons.map((item) => normalizeText(item)).filter(Boolean).slice(0, 4)
      : [],
  };
};

const mergeSignals = (base, extra) => {
  const merged = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (typeof value === "boolean") {
      merged[key] = Boolean(merged[key]) || value;
    } else if (!(key in merged)) {
      merged[key] = value;
    }
  }
  return merged;
};

const uniqueReasons = (...sources) => {
  const output = [];
  for (const source of sources) {
    const items = Array.isArray(source) ? source : [];
    for (const item of items) {
      const value = normalizeText(item);
      if (value && !output.includes(value)) {
        output.push(value);
      }
    }
  }
  return output;
};

const recalculateOperationalScore = (analysis, nextVideoScore) => {
  const weights = [
    [Number(analysis.metadata_score ?? 0), 0.35],
    [Number(analysis.text_score ?? 0), 0.35],
    [Number(analysis.image_score ?? 0), Number(analysis.image_score ?? 0) > 0 ? 0.15 : 0],
    [Number(analysis.audio_score ?? 0), Number(analysis.audio_score ?? 0) > 0 ? 0.075 : 0],
    [Number(nextVideoScore ?? 0), Number(nextVideoScore ?? 0) > 0 ? 0.075 : 0],
  ].filter(([, weight]) => weight > 0);

  const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  const score = weights.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
  const rounded = Math.max(0, Math.min(100, Math.round(score)));

  if (rounded >= 80) return { operationalScore: rounded, bucket: "critical" };
  if (rounded >= 60) return { operationalScore: rounded, bucket: "high" };
  if (rounded >= 35) return { operationalScore: rounded, bucket: "medium" };
  return { operationalScore: rounded, bucket: "low" };
};

const updateAnalysis = async (report, videoFrameResult, frameCount) => {
  const analysis = report.ai_analysis ?? {};
  const existingMediaEvidence = analysis.media_evidence_json ?? {};
  const existingProcessed = analysis.processed_modalities_json ?? {};
  const existingSignals = analysis.extracted_signals_json ?? {};
  const existingReasons = analysis.scoring_reasons_json ?? [];
  const existingSummary = normalizeText(analysis.summary);
  const combinedSummary = uniqueReasons([existingSummary], [videoFrameResult.summary]).join(" ");
  const nextConfidence = Math.max(Number(analysis.confidence_score ?? 0), Number(videoFrameResult.confidence ?? 0));
  const nextSignals = mergeSignals(existingSignals, videoFrameResult.visibleSignals);
  const nextReasons = uniqueReasons(existingReasons, videoFrameResult.reasons).slice(0, 6);
  const nextMediaEvidence = {
    ...existingMediaEvidence,
    video_frame_analysis_status: "completed",
    video_frame_count: frameCount,
    video_frame_summaries: uniqueReasons(existingMediaEvidence.video_frame_summaries, [videoFrameResult.summary]).slice(0, 4),
  };
  const nextProcessed = {
    ...existingProcessed,
    video: true,
  };
  const nextStatus = analysis.analysis_status === "failed" ? "partial" : "completed";
  const { operationalScore, bucket } = recalculateOperationalScore(analysis, videoFrameResult.score);

  await fetchJson(`${SUPABASE_URL}/rest/v1/report_ai_analysis?report_id=eq.${report.id}`, {
    method: "PATCH",
    headers: {
      ...apiHeaders,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      analysis_status: nextStatus,
      operational_score: operationalScore,
      score_bucket: bucket,
      video_score: videoFrameResult.score,
      confidence_score: Number(nextConfidence.toFixed(3)),
      summary: combinedSummary || videoFrameResult.summary,
      extracted_signals_json: nextSignals,
      scoring_reasons_json: nextReasons,
      media_evidence_json: nextMediaEvidence,
      processed_modalities_json: nextProcessed,
      provider_fallback: "groq",
      model_fallback: GROQ_VISION_MODEL,
      analyzed_at: new Date().toISOString(),
      needs_recompute: false,
      last_error: null,
    }),
  });

  await fetchJson(`${SUPABASE_URL}/rest/v1/report_ai_runs`, {
    method: "POST",
    headers: {
      ...apiHeaders,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      report_id: report.id,
      run_kind: "media",
      status: "completed",
      provider_fallback: "groq",
      model_fallback: GROQ_VISION_MODEL,
      prompt_version: "report-ai-video-frames-v1",
      summary: videoFrameResult.summary,
      score_snapshot: operationalScore,
      metadata_json: {
        video_frame_score: videoFrameResult.score,
        video_frame_count: frameCount,
      },
    }),
  });
};

const markVideoFrameFailure = async (report, message) => {
  const analysis = report.ai_analysis ?? {};
  const existingMediaEvidence = analysis.media_evidence_json ?? {};
  const existingReasons = analysis.scoring_reasons_json ?? [];

  await fetchJson(`${SUPABASE_URL}/rest/v1/report_ai_analysis?report_id=eq.${report.id}`, {
    method: "PATCH",
    headers: {
      ...apiHeaders,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      analysis_status: analysis.analysis_status === "completed" ? "partial" : (analysis.analysis_status ?? "partial"),
      media_evidence_json: {
        ...existingMediaEvidence,
        video_frame_analysis_status: "failed",
        video_frame_last_error: message,
      },
      scoring_reasons_json: uniqueReasons(existingReasons, [`Video frame analysis unavailable: ${message}`]).slice(0, 6),
      last_error: message,
      needs_recompute: true,
      updated_at: new Date().toISOString(),
    }),
  });

  await fetchJson(`${SUPABASE_URL}/rest/v1/report_ai_runs`, {
    method: "POST",
    headers: {
      ...apiHeaders,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      report_id: report.id,
      run_kind: "media",
      status: "failed",
      prompt_version: "report-ai-video-frames-v1",
      error_text: message,
      metadata_json: {
        worker: "video-frame",
      },
    }),
  });
};

const processReport = async (report) => {
  const videoUrl = (report.media_urls ?? []).find(looksVideo);
  if (!videoUrl) return { reportId: report.id, status: "skipped", reason: "No video URL" };

  const workspace = await mkdtemp(join(tmpdir(), TMP_PREFIX));
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video (${response.status})`);
    }

    const videoBuffer = Buffer.from(await response.arrayBuffer());
    const extension = basename(videoUrl).split(".").pop() || "mp4";
    const videoPath = join(workspace, `input.${extension}`);
    await writeFile(videoPath, videoBuffer);

    const framePaths = await extractFrames(videoPath, workspace);
    const frameDataUrls = await Promise.all(framePaths.map(fileToDataUrl));
    const videoFrameResult = await analyzeVideoFrames(report, frameDataUrls);
    await updateAnalysis(report, videoFrameResult, framePaths.length);

    return {
      reportId: report.id,
      status: "processed",
      frameCount: framePaths.length,
      score: videoFrameResult.score,
    };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};

const main = async () => {
  const reports = await fetchCandidateReports();
  if (reports.length === 0) {
    console.log(JSON.stringify({ processed: 0, message: "No video reports pending frame analysis" }, null, 2));
    return;
  }

  const results = [];
  for (const report of reports) {
    try {
      results.push(await processReport(report));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      try {
        await markVideoFrameFailure(report, message);
      } catch (updateError) {
        console.error("Failed to persist video-frame failure", updateError);
      }
      results.push({
        reportId: report.id,
        status: "failed",
        error: message,
      });
    }
  }

  console.log(JSON.stringify({
    processed: results.filter((item) => item.status === "processed").length,
    failed: results.filter((item) => item.status === "failed").length,
    results,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
