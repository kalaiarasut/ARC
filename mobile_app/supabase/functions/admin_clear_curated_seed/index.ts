/// <reference path="../types.d.ts" />

import { createServiceRoleSupabaseClient, handleCors, jsonResponse, requireAdmin } from "../_shared_admin.ts";
import { clearCuratedSeedData } from "../_curated_hazard_seed_admin.ts";

const FUNCTION_VERSION = "2";

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const serviceSupabase = createServiceRoleSupabaseClient();
    const result = await clearCuratedSeedData(serviceSupabase);
    return jsonResponse({ ...result, function_version: FUNCTION_VERSION });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to clear curated seed" },
      500,
    );
  }
});
