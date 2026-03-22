/// <reference path="../types.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AdminAuthResult = {
  supabase: any;
  user: { id: string; email?: string | null };
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

export async function requireAdmin(request: Request): Promise<AdminAuthResult | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user) {
    return jsonResponse({ error: "Invalid auth token" }, 401);
  }

  const { data: roleRow, error: roleError } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) {
    return jsonResponse({ error: `Failed to verify admin role: ${roleError.message}` }, 500);
  }

  if (roleRow?.role !== "admin") {
    return jsonResponse({ error: "Admin access required" }, 403);
  }

  return { supabase, user };
}
