import { requireRedis } from "./redis";
import type { ScanResult } from "@/types/scan";

const SCAN_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const KEY_PREFIX = "scan:";

export async function saveScan(result: ScanResult): Promise<string> {
  const id = crypto.randomUUID();
  // @upstash/redis serializes/deserializes JSON automatically — pass the
  // object directly rather than JSON.stringify-ing it ourselves.
  await requireRedis().set(`${KEY_PREFIX}${id}`, result, { ex: SCAN_TTL_SECONDS });
  return id;
}

export async function getScan(id: string): Promise<ScanResult | null> {
  return requireRedis().get<ScanResult>(`${KEY_PREFIX}${id}`);
}
