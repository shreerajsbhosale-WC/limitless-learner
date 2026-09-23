import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Tiered rate limiting, ported from the security package's Express limiters
 * and enforced in the database so it holds across every server instance.
 *
 * Two keyings:
 *  - per account, for signed-in calls (RLS-scoped RPC)
 *  - per visitor, for guest calls (service-role RPC, salted IP hash)
 *
 * Guests can generate study kits without an account, so the per-visitor tier
 * is what actually protects the AI budget from cost abuse.
 */
export const RATE_LIMITS = {
  generate: { max: 20, windowSeconds: 60 * 60 },
  assistant: { max: 15, windowSeconds: 60 },
  story: { max: 20, windowSeconds: 60 * 60 },
  explain: { max: 60, windowSeconds: 60 * 60 },
  meta: { max: 60, windowSeconds: 60 * 60 },
} as const;

/** Guests get a tighter allowance than signed-in accounts. */
export const GUEST_RATE_LIMITS = {
  generate: { max: 5, windowSeconds: 60 * 60 },
  story: { max: 5, windowSeconds: 60 * 60 },
  explain: { max: 30, windowSeconds: 60 * 60 },
  meta: { max: 30, windowSeconds: 60 * 60 },
} as const;

export type RateBucket = keyof typeof RATE_LIMITS;
export type GuestBucket = keyof typeof GUEST_RATE_LIMITS;

function limitMessage(bucket: string): string {
  return bucket === "assistant"
    ? "Slow down — you're sending messages too fast. Try again in a minute."
    : "You've hit this hour's limit. Try again a bit later, or sign in for a higher allowance.";
}

export async function enforceRateLimit(
  supabase: SupabaseClient<any, any, any>,
  bucket: RateBucket,
): Promise<void> {
  const { max, windowSeconds } = RATE_LIMITS[bucket];
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    _bucket: bucket,
    _max: max,
    _window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] check failed", error.message);
    return; // fail open on infrastructure errors, never block a paying study session
  }
  if (data === false) throw new Error(limitMessage(bucket));
}

function callerIp(): string {
  const header =
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-real-ip") ??
    getRequestHeader("x-forwarded-for") ??
    "";
  // x-forwarded-for may be a chain; the left-most entry is the origin client.
  return header.split(",")[0]?.trim() || "unknown";
}

async function hashIp(ip: string): Promise<string> {
  // Salted so the stored value can't be reversed into a browsing history.
  const salt = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "limitless";
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Per-visitor limit for endpoints reachable without signing in.
 * Fails open on infrastructure errors, closed on an exceeded window.
 */
export async function enforceGuestRateLimit(bucket: GuestBucket): Promise<void> {
  const { max, windowSeconds } = GUEST_RATE_LIMITS[bucket];
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ipHash = await hashIp(callerIp());
    const { data, error } = await supabaseAdmin.rpc("consume_ip_rate_limit", {
      _ip_hash: ipHash,
      _bucket: bucket,
      _max: max,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rate-limit:guest] check failed", error.message);
      return;
    }
    if (data === false) throw new Error(limitMessage(bucket));
  } catch (err) {
    // Re-throw our own limit error; swallow infrastructure failures.
    if (err instanceof Error && err.message.includes("limit")) throw err;
    console.error("[rate-limit:guest] unavailable", err);
  }
}
