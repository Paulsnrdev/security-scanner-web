import { Redis } from "@upstash/redis";

function buildRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// null when UPSTASH_REDIS_REST_URL/TOKEN are absent (e.g. local dev without
// Upstash configured) — callers decide whether that's a no-op or an error.
export const redis = buildRedisClient();

export function requireRedis(): Redis {
  if (!redis) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set — required to persist scans."
    );
  }
  return redis;
}
