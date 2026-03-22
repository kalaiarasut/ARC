// Supabase Edge Function: send queued push notifications via FCM (legacy HTTP API).
//
// Required secrets:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - FCM_SERVER_KEY (Firebase Cloud Messaging server key)
//
// Suggested invocation:
// - Cron every 1 minute

/// <reference path="../types.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type OutboxRow = {
  id: string;
  push_token_id: string | null;
  user_id: string | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  attempts: number;
};

type PushTokenRow = {
  id: string;
  user_id: string;
  token: string;
  enabled: boolean;
};

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", { status: 500 });
  }
  if (!fcmServerKey) {
    return new Response("Missing FCM_SERVER_KEY", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: outbox, error: outboxError } = await supabase
    .from("notification_outbox")
    .select("id,push_token_id,user_id,type,title,body,data,attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (outboxError) {
    return new Response(JSON.stringify({ error: outboxError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const results: Array<{ id: string; sent: number; failed: number }> = [];

  for (const item of outbox ?? []) {
    let tokens: PushTokenRow[] | null = null;
    let tokenError: { message: string } | null = null;

    if (item.push_token_id) {
      const response = await supabase
        .from("push_tokens")
        .select("id,user_id,token,enabled")
        .eq("id", item.push_token_id)
        .eq("enabled", true);
      tokens = response.data as PushTokenRow[] | null;
      tokenError = response.error;
    } else if (item.user_id) {
      const response = await supabase
        .from("push_tokens")
        .select("id,user_id,token,enabled")
        .eq("user_id", item.user_id)
        .eq("enabled", true);
      tokens = response.data as PushTokenRow[] | null;
      tokenError = response.error;
    } else {
      await supabase
        .from("notification_outbox")
        .update({ status: "failed", last_error: "missing_recipient" })
        .eq("id", item.id);
      continue;
    }

    if (tokenError) {
      await supabase
        .from("notification_outbox")
        .update({ status: "failed", last_error: `token_query:${tokenError.message}` })
        .eq("id", item.id);
      continue;
    }

    const uniqueTokens = Array.from(
      new Set(
        (tokens ?? [])
          .map((t: PushTokenRow) => t.token)
          .filter((t: string) => !!t && t.trim().length > 0),
      ),
    );

    let sent = 0;
    let failed = 0;

    for (const token of uniqueTokens) {
      const payload = {
        to: token,
        // Data-only so Flutter controls foreground/background notification behavior.
        data: {
          type: item.type,
          title: item.title,
          body: item.body,
          ...item.data,
        },
        priority: "high",
      };

      const resp = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        failed++;
        continue;
      }

      const json = await resp.json().catch(() => null);
      // Legacy API returns { success: 1, failure: 0, results: [...] }
      const firstResult = json?.results?.[0];
      if (firstResult?.error) {
        failed++;
        const err = String(firstResult.error);
        // Disable invalid tokens.
        if (err === "NotRegistered" || err === "InvalidRegistration") {
          await supabase.from("push_tokens").update({ enabled: false }).eq("token", token);
        }
      } else {
        sent++;
      }
    }

    if (failed === 0 && sent > 0) {
      await supabase
        .from("notification_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", item.id);
    } else {
      await supabase
        .from("notification_outbox")
        .update({
          attempts: (item.attempts ?? 0) + 1,
          last_error: failed > 0 ? `failed:${failed}` : "no_tokens",
          status: failed > 0 ? "failed" : "sent",
          sent_at: sent > 0 ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
    }

    results.push({ id: item.id, sent, failed });
  }

  return new Response(JSON.stringify({ processed: (outbox ?? []).length, results }), {
    headers: { "content-type": "application/json" },
  });
});
