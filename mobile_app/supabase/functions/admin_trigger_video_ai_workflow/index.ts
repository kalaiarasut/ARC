/// <reference path="../types.d.ts" />

import {
  handleCors,
  jsonResponse,
  requireAdmin,
} from "../_shared_admin.ts";

const GITHUB_API_URL = (Deno.env.get("GITHUB_API_URL") ?? "https://api.github.com").trim().replace(/\/+$/, "");
const GITHUB_ACTIONS_TOKEN = (Deno.env.get("GITHUB_ACTIONS_TOKEN") ?? "").trim();
const GITHUB_ACTIONS_REPO_OWNER = (Deno.env.get("GITHUB_ACTIONS_REPO_OWNER") ?? "").trim();
const GITHUB_ACTIONS_REPO_NAME = (Deno.env.get("GITHUB_ACTIONS_REPO_NAME") ?? "").trim();
const GITHUB_ACTIONS_WORKFLOW_ID = (Deno.env.get("GITHUB_ACTIONS_WORKFLOW_ID") ?? "process-report-ai-videos.yml").trim();
const GITHUB_ACTIONS_WORKFLOW_REF = (Deno.env.get("GITHUB_ACTIONS_WORKFLOW_REF") ?? "main").trim();

const parsePositiveInt = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
};

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  if (!GITHUB_ACTIONS_TOKEN || !GITHUB_ACTIONS_REPO_OWNER || !GITHUB_ACTIONS_REPO_NAME || !GITHUB_ACTIONS_WORKFLOW_ID) {
    return jsonResponse({ error: "Missing GitHub Actions workflow configuration" }, 500);
  }

  const payload = await request.json().catch(() => null);
  const limit = parsePositiveInt(payload?.report_ai_video_worker_limit, 5, 1, 20);
  const frameCount = parsePositiveInt(payload?.report_ai_video_frame_count, 3, 2, 5);
  const ref = typeof payload?.ref === "string" && payload.ref.trim() ? payload.ref.trim() : GITHUB_ACTIONS_WORKFLOW_REF;

  const response = await fetch(
    `${GITHUB_API_URL}/repos/${encodeURIComponent(GITHUB_ACTIONS_REPO_OWNER)}/${encodeURIComponent(GITHUB_ACTIONS_REPO_NAME)}/actions/workflows/${encodeURIComponent(GITHUB_ACTIONS_WORKFLOW_ID)}/dispatches`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${GITHUB_ACTIONS_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Ocean-Admin-Video-AI-Trigger",
      },
      body: JSON.stringify({
        ref,
        inputs: {
          report_ai_video_worker_limit: String(limit),
          report_ai_video_frame_count: String(frameCount),
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return jsonResponse(
      {
        error: "Failed to trigger GitHub Actions workflow",
        details: body || `GitHub returned ${response.status}`,
      },
      502,
    );
  }

  return jsonResponse({
    ok: true,
    workflow_id: GITHUB_ACTIONS_WORKFLOW_ID,
    ref,
    report_ai_video_worker_limit: limit,
    report_ai_video_frame_count: frameCount,
  });
});
