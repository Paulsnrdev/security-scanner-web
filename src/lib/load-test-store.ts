import { requireRedis } from "./redis";
import { LOAD_TEST_RECORD_TTL_SECONDS } from "./constants";
import type { LoadTestRecord } from "@/types/load-test";

const recordKey = (domain: string) => `loadtest:${domain}`;

export async function getLoadTestRecord(domain: string): Promise<LoadTestRecord | null> {
  return requireRedis().get<LoadTestRecord>(recordKey(domain));
}

export async function saveLoadTestRecord(record: LoadTestRecord): Promise<void> {
  await requireRedis().set(recordKey(record.domain), record, {
    ex: LOAD_TEST_RECORD_TTL_SECONDS,
  });
}
