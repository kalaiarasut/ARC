/// <reference path="../types.d.ts" />

import { createServiceRoleSupabaseClient, handleCors, jsonResponse, requireAdmin } from "../_shared_admin.ts";
import {
  buildCuratedSeedRecords,
  CURATED_SEED_DEVICE_PREFIX,
  CURATED_SEED_VERSION,
} from "../_curated_hazard_seed.ts";
import {
  clearCuratedSeedData,
  ensureSeedUsers,
  getSeedMediaAsset,
  uploadSeedMediaAsset,
} from "../_curated_hazard_seed_admin.ts";

type PreparedRow = {
  row: Record<string, unknown>;
  storagePaths: string[];
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const locationValue = (latitude: number, longitude: number) => `SRID=4326;POINT(${longitude} ${latitude})`;

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => ({}));
  const replaceExisting = payload?.replace_existing !== false;

  const preparedRows: PreparedRow[] = [];
  const uploadedStoragePaths: string[] = [];

  try {
    const serviceSupabase = createServiceRoleSupabaseClient();
    const seedNow = new Date();
    const curatedRecords = buildCuratedSeedRecords(seedNow);
    const ensuredUsers = await ensureSeedUsers(serviceSupabase);

    for (const record of curatedRecords) {
      const ensuredUser = ensuredUsers.get(record.reporter_key);
      if (!ensuredUser) {
        throw new Error(`Seed user not available for ${record.reporter_key}`);
      }

      const reportId = crypto.randomUUID();
      const mediaUrls: string[] = [];
      const storagePaths: string[] = [];

      for (const mediaAssetKey of record.media_asset_keys ?? []) {
        const asset = getSeedMediaAsset(mediaAssetKey);
        const uploaded = await uploadSeedMediaAsset(serviceSupabase, asset, ensuredUser.id, reportId);
        mediaUrls.push(uploaded.publicUrl);
        storagePaths.push(uploaded.storagePath);
        uploadedStoragePaths.push(uploaded.storagePath);
      }

      preparedRows.push({
        storagePaths,
        row: {
          id: reportId,
          client_id: crypto.randomUUID(),
          user_id: ensuredUser.id,
          user_phone: ensuredUser.profile.user_phone,
          user_name: ensuredUser.profile.user_name,
          hazard_type: record.hazard_type,
          description: record.description,
          translation_status: "pending",
          translation_attempts: 0,
          translation_last_error: null,
          translation_next_retry_at: null,
          translation_provider: null,
          translation_model: null,
          translated_english: null,
          detected_language: null,
          translated_at: null,
          location: locationValue(record.latitude, record.longitude),
          latitude: record.latitude,
          longitude: record.longitude,
          is_high_risk: record.is_high_risk,
          people_at_risk: record.people_at_risk,
          urgency_level: record.urgency_level,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          upload_complete: mediaUrls.length > 0,
          status: record.status,
          event_time: record.event_time,
          created_at: record.created_at,
          device_id: `${CURATED_SEED_DEVICE_PREFIX}:${record.key}`,
        },
      });
    }

    if (replaceExisting) {
      await clearCuratedSeedData(serviceSupabase, { deleteUsers: false });
    }

    const rows = preparedRows.map((item) => item.row);
    for (const batch of chunk(rows, 50)) {
      const { error: insertError } = await serviceSupabase.from("hazard_reports").insert(batch);
      if (insertError) {
        throw new Error(`Failed to insert curated reports: ${insertError.message}`);
      }
    }

    return jsonResponse({
      seed_version: CURATED_SEED_VERSION,
      total_reports: preparedRows.length,
      reports_with_media: preparedRows.filter((item) => item.storagePaths.length > 0).length,
      languages: Array.from(new Set(curatedRecords.map((record) => record.language))),
      duplicate_record_key: null,
      replace_existing: replaceExisting,
    });
  } catch (error) {
    if (uploadedStoragePaths.length > 0) {
      try {
        const cleanupSupabase = createServiceRoleSupabaseClient();
        await cleanupSupabase.storage.from("hazard-media").remove(uploadedStoragePaths);
      } catch {
        // best-effort cleanup only
      }
    }

    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to seed curated reports" },
      500,
    );
  }
});
