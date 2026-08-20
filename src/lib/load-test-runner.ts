import autocannon from "autocannon";
import { checkUrlIsPublic } from "./ssrf/guard";
import { LOAD_TEST_DURATION_SECONDS, LOAD_TEST_CONNECTIONS } from "./constants";
import type { LoadTestResult } from "@/types/load-test";

const STOP_SAFETY_MARGIN_SECONDS = 5;
const BAILOUT_ERROR_COUNT = 100;

// autocannon has no built-in way to pin a connection to a pre-resolved IP
// (no custom `lookup`/`agent` option), unlike safeFetch. Without pinning, it
// would re-resolve DNS on every request during the run, reopening the
// DNS-rebinding gap safeFetch was built to close — worse here, since a load
// test is many requests over several seconds, not one. Instead: resolve and
// validate the IP once, then hand autocannon the IP-literal URL directly,
// with `servername` (SNI) and a `Host` header set to the real hostname so
// the target still sees a normal request.
export async function runLoadTest(domain: string): Promise<LoadTestResult> {
  const check = await checkUrlIsPublic(`https://${domain}`);
  if (!check.ok || !check.resolvedIps?.length) {
    throw new Error(check.reason ?? `SSRF check failed for ${domain}`);
  }

  const ip = check.resolvedIps[0];
  const host = ip.includes(":") ? `[${ip}]` : ip;
  const pinnedUrl = `https://${host}/`;

  const instance = autocannon({
    url: pinnedUrl,
    servername: domain,
    headers: { Host: domain },
    connections: LOAD_TEST_CONNECTIONS,
    duration: LOAD_TEST_DURATION_SECONDS,
    bailout: BAILOUT_ERROR_COUNT,
  });

  // Belt-and-suspenders: force-stop if autocannon's own `duration` option
  // somehow doesn't cut the run short.
  const safetyTimer = setTimeout(
    () => instance.stop(),
    (LOAD_TEST_DURATION_SECONDS + STOP_SAFETY_MARGIN_SECONDS) * 1000
  );

  try {
    const result = await instance;
    return {
      requestsPerSecond: Math.round(result.requests.mean),
      totalRequests: result.requests.sent ?? 0,
      completedRequests: result.requests.total ?? 0,
      latencyMs: {
        mean: result.latency.mean,
        p50: result.latency.p50,
        p90: result.latency.p90,
        p99: result.latency.p99,
        max: result.latency.max,
      },
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx,
    };
  } finally {
    clearTimeout(safetyTimer);
  }
}
