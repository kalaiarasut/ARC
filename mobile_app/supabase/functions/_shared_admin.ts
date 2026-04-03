/// <reference path="../types.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AdminAuthResult = {
  supabase: any;
  user: { id: string; email?: string | null };
};

export type AuthenticatedUserResult = {
  supabase: any;
  user: { id: string; email?: string | null };
};

export type WorkerAuthResult = {
  supabase: any;
};

export type AdminAuditEventInsertInput = {
  event_kind?: "audit" | "activity";
  entity_type: string;
  entity_id: string;
  action: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  reason?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  changed_fields?: string[];
  created_at?: string;
};

const jsonHeaders = { "content-type": "application/json" };
export const corsHeaders = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
  "access-control-allow-methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

export function handleCors(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

export function createServiceRoleSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUserResult | Response> {
  let supabase: any;
  try {
    supabase = createServiceRoleSupabaseClient();
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Failed to create Supabase client" }, 500);
  }

  const authHeader =
    request.headers.get("x-supabase-auth") ??
    request.headers.get("X-Supabase-Auth") ??
    request.headers.get("Authorization") ??
    request.headers.get("authorization") ??
    "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return jsonResponse({ error: "Missing bearer token" }, 401);
  }
  supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user) {
    return jsonResponse({ error: "Invalid auth token" }, 401);
  }

  return { supabase, user };
}

export async function requireWorkerSecret(
  request: Request,
  secretName = "REPORT_TRANSLATION_WORKER_SECRET",
): Promise<WorkerAuthResult | Response> {
  const expectedSecret = (Deno.env.get(secretName) ?? "").trim();
  if (!expectedSecret) {
    return jsonResponse({ error: `Missing ${secretName}` }, 500);
  }

  const providedSecret = (request.headers.get("x-worker-secret") ?? "").trim();
  if (!providedSecret || providedSecret !== expectedSecret) {
    return jsonResponse({ error: "Invalid worker secret" }, 401);
  }

  try {
    return { supabase: createServiceRoleSupabaseClient() };
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Failed to create Supabase client" }, 500);
  }
}

export async function isAdminUser(supabase: any, userId: string): Promise<boolean> {
  const { data: roleRow, error: roleError } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleError) {
    throw new Error(`Failed to verify admin role: ${roleError.message}`);
  }

  return roleRow?.role === "admin";
}

export async function requireAdmin(request: Request): Promise<AdminAuthResult | Response> {
  const auth = await requireAuthenticatedUser(request);
  if (auth instanceof Response) return auth;

  try {
    const isAdmin = await isAdminUser(auth.supabase, auth.user.id);
    if (!isAdmin) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to verify admin role" },
      500,
    );
  }

  return auth;
}

export function computeChangedFields(
  oldData: Record<string, unknown> | null | undefined,
  newData: Record<string, unknown> | null | undefined,
) {
  const previous = oldData ?? {};
  const next = newData ?? {};
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  return Array.from(keys)
    .filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]))
    .sort();
}

export async function insertAdminAuditEvent(
  supabase: any,
  input: AdminAuditEventInsertInput,
) {
  const { error } = await supabase.from("admin_audit_log").insert({
    event_kind: input.event_kind ?? "audit",
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    action: input.action,
    actor_user_id: input.actor_user_id ?? null,
    actor_email: input.actor_email ?? null,
    reason: input.reason ?? null,
    old_data: input.old_data ?? null,
    new_data: input.new_data ?? null,
    metadata: input.metadata ?? {},
    changed_fields: input.changed_fields ?? computeChangedFields(input.old_data, input.new_data),
    created_at: input.created_at ?? new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to write audit event: ${error.message}`);
  }
}
