import {
  CURATED_SEED_DEVICE_PREFIX,
  SEED_MEDIA_ASSETS,
  SEED_REPORTERS,
  type SeedMediaAsset,
  type SeedReporterProfile,
} from "./_curated_hazard_seed.ts";

const SEED_EMAIL_SUFFIX = "@seed.ocean.local";
const PUBLIC_BUCKET_PREFIX = "/storage/v1/object/public/hazard-media/";

const allReporterProfiles = (): SeedReporterProfile[] =>
  Object.values(SEED_REPORTERS).flatMap((group) => [group.primary, group.secondary]);

const mediaPathFromPublicUrl = (url: string): string | null => {
  const markerIndex = url.indexOf(PUBLIC_BUCKET_PREFIX);
  if (markerIndex < 0) return null;
  const raw = url.slice(markerIndex + PUBLIC_BUCKET_PREFIX.length);
  return decodeURIComponent(raw.split("?")[0] ?? "").trim() || null;
};

const inferContentType = (asset: SeedMediaAsset, response: Response) => {
  const lower = asset.storage_file_name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".ogv") || lower.endsWith(".ogg")) return "video/ogg";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mp4")) return "video/mp4";
  const responseType = response.headers.get("content-type")?.split(";")[0]?.trim();
  if (responseType) return responseType;
  return asset.kind === "video" ? "video/webm" : "image/jpeg";
};

export const uploadSeedMediaAsset = async (
  supabase: any,
  asset: SeedMediaAsset,
  reporterId: string,
  reportId: string,
) => {
  const sanitizedName = asset.storage_file_name.replace(/[^A-Za-z0-9._-]+/g, "_");
  const canonicalPath = `seed-curated/source-assets/${sanitizedName}`;
  const storagePath = `seed-curated/${reporterId}/${reportId}/${sanitizedName}`;

  const { data: copied, error: copyError } = await supabase.storage
    .from("hazard-media")
    .copy(canonicalPath, storagePath);

  if (!copyError && copied) {
    const { data } = supabase.storage.from("hazard-media").getPublicUrl(storagePath);
    const publicUrl = String(data?.publicUrl ?? "").trim();
    if (!publicUrl) {
      throw new Error(`Supabase returned no public URL for ${asset.key}`);
    }
    return {
      publicUrl,
      storagePath,
    };
  }

  let response: Response | null = null;
  let lastStatus: number | null = null;
  const attemptDelaysMs = [0, 1200, 3000, 6000];
  for (const delayMs of attemptDelaysMs) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    const fetched = await fetch(asset.download_url, {
      headers: {
        "user-agent": "OceanSeedBot/1.0 (+https://zaimfwpaloadjrljgdzd.supabase.co)",
      },
    });
    if (fetched.ok) {
      response = fetched;
      break;
    }
    lastStatus = fetched.status;
    if (fetched.status !== 429 && fetched.status < 500) {
      break;
    }
  }

  if (!response) {
    throw new Error(`Failed to download ${asset.key} from source (${lastStatus ?? "unknown"})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = inferContentType(asset, response);

  const { error: canonicalUploadError } = await supabase.storage.from("hazard-media").upload(canonicalPath, bytes, {
    upsert: true,
    contentType,
  });

  if (canonicalUploadError) {
    throw new Error(`Failed to cache ${asset.key}: ${canonicalUploadError.message}`);
  }

  const { error: uploadError } = await supabase.storage.from("hazard-media").upload(storagePath, bytes, {
    upsert: true,
    contentType,
  });

  if (uploadError) {
    throw new Error(`Failed to upload ${asset.key}: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("hazard-media").getPublicUrl(storagePath);
  const publicUrl = String(data?.publicUrl ?? "").trim();
  if (!publicUrl) {
    throw new Error(`Supabase returned no public URL for ${asset.key}`);
  }

  return {
    publicUrl,
    storagePath,
  };
};

export const ensureSeedUsers = async (supabase: any) => {
  const profiles = allReporterProfiles();
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });

  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`);
  }

  const users = Array.isArray(listed?.users) ? listed.users : [];
  const byEmail = new Map<string, any>();
  users.forEach((user: any) => {
    const email = String(user?.email ?? "").trim().toLowerCase();
    if (email) byEmail.set(email, user);
  });

  const result = new Map<string, { id: string; profile: SeedReporterProfile }>();

  for (const profile of profiles) {
    const existing = byEmail.get(profile.email.toLowerCase());
    if (existing?.id) {
      result.set(profile.key, { id: String(existing.id), profile });
      continue;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: profile.email,
      password: profile.password,
      email_confirm: true,
      user_metadata: {
        full_name: profile.user_name,
        seed_profile: profile.key,
        seed_language: profile.language,
      },
    });

    const createdUser = created?.user;
    if (createError || !createdUser?.id) {
      throw new Error(`Failed to create seed user ${profile.email}: ${createError?.message ?? "Unknown error"}`);
    }

    result.set(profile.key, { id: String(createdUser.id), profile });
  }

  return result;
};

export const clearCuratedSeedData = async (
  supabase: any,
  options?: {
    deleteUsers?: boolean;
  },
) => {
  const { data: seededReports, error: seededReportsError } = await supabase
    .from("hazard_reports")
    .select("id, media_urls")
    .like("device_id", `${CURATED_SEED_DEVICE_PREFIX}:*`);

  if (seededReportsError) {
    throw new Error(`Failed to list curated seed reports: ${seededReportsError.message}`);
  }

  const storagePaths = new Set<string>();
  for (const report of seededReports ?? []) {
    const mediaUrls = Array.isArray(report?.media_urls) ? report.media_urls : [];
    mediaUrls.forEach((url: string) => {
      const path = mediaPathFromPublicUrl(String(url ?? ""));
      if (path) storagePaths.add(path);
    });
  }

  const { error: deleteReportsError } = await supabase
    .from("hazard_reports")
    .delete()
    .like("device_id", `${CURATED_SEED_DEVICE_PREFIX}:*`);

  if (deleteReportsError) {
    throw new Error(`Failed to delete curated seed reports: ${deleteReportsError.message}`);
  }

  if (storagePaths.size > 0) {
    const { error: removeError } = await supabase.storage.from("hazard-media").remove(Array.from(storagePaths));
    if (removeError) {
      throw new Error(`Failed to delete curated seed media: ${removeError.message}`);
    }
  }

  let deletedUsers = 0;
  if (options?.deleteUsers !== false) {
    const { data: listedUsers, error: listUsersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

    if (listUsersError) {
      throw new Error(`Failed to list seed auth users: ${listUsersError.message}`);
    }

    const users = Array.isArray(listedUsers?.users) ? listedUsers.users : [];
    for (const user of users) {
      const email = String(user?.email ?? "").trim().toLowerCase();
      if (!email.endsWith(SEED_EMAIL_SUFFIX)) continue;
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(String(user.id));
      if (!deleteUserError) {
        deletedUsers += 1;
      }
    }
  }

  return {
    deleted_reports: (seededReports ?? []).length,
    deleted_media_objects: storagePaths.size,
    deleted_users: deletedUsers,
  };
};

export const getSeedMediaAsset = (key: string) => {
  const asset = SEED_MEDIA_ASSETS[key];
  if (!asset) {
    throw new Error(`Unknown seed media asset: ${key}`);
  }
  return asset;
};
