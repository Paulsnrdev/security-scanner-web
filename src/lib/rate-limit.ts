import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { LOAD_TEST_RATE_LIMIT_WINDOW } from "./constants";

// No Upstash env vars configured (e.g. local dev) — every check passes.
export const scanLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "scan-limit",
    })
  : null;

// Keyed by domain, not by IP/device — the thing being protected is the
// target site, so the limit applies regardless of who's asking. Sliding, not
// fixed, window: a fixed window resets on a calendar boundary, so two
// requests timed just before/after e.g. the top of the hour could both go
// through — defeating "roughly 1 per hour". A sliding window has no such gap.
export const loadTestLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, LOAD_TEST_RATE_LIMIT_WINDOW),
      prefix: "load-test-limit",
    })
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: Infinity, remaining: Infinity, reset: 0 };
  }
  return limiter.limit(identifier);
}

export function checkScanRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(scanLimiter, identifier);
}

export function checkLoadTestRateLimit(domain: string): Promise<RateLimitResult> {
  return checkRateLimit(loadTestLimiter, domain);
}
