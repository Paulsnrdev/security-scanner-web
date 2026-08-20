import type { Headers as UndiciHeaders } from "undici";
import type { CategoryResult, Finding } from "@/types/scan";

export function scanPerformance(headers: UndiciHeaders, ttfbMs: number): CategoryResult {
  const findings: Finding[] = [];
  const contentEncoding = headers.get("content-encoding");
  const cacheControl = headers.get("cache-control");

  if (!contentEncoding) {
    findings.push({
      severity: "low",
      message: "No response compression detected (Content-Encoding header absent)",
    });
  }

  if (!cacheControl) {
    findings.push({
      severity: "low",
      message: "No Cache-Control header set on the response",
    });
  }

  return {
    ok: true,
    findings,
    data: { ttfbMs, contentEncoding: contentEncoding ?? null, cacheControl: cacheControl ?? null },
  };
}
