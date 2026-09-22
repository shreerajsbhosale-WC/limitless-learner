import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Per-account rate limiting, enforced in the database so it holds across
 * every server instance. Buckets mirror the tiers from the security review:
 * tight on AI generation (cost abuse), looser on chat.
 */
export const RATE_LIMITS = {
  generate: { max: 20, windowSeconds: 60 * 60 },
  assistant: { max: 15, windowSeconds: 60 },
  story: { max: 20, windowSeconds: 60 * 60 },
} as const;

export type RateBucket = keyof typeof RATE_LIMITS;

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
  if (data === false) {
    throw new Error(
      bucket === "assistant"
        ? "Slow down — you're sending messages too fast. Try again in a minute."
        : "You've hit this hour's generation limit. Try again a bit later.",
    );
  }
}
