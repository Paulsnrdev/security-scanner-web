import { safeFetch } from "./ssrf/safe-fetch";
import { scanHeaders } from "./scanners/headers";
import { scanHosting } from "./scanners/hosting";
import { scanPerformance } from "./scanners/performance";
import { scanTls } from "./scanners/tls";
import { scanDns } from "./scanners/dns";
import { scanWhois } from "./scanners/whois";
import type { CategoryResult, ScanResult, Severity } from "@/types/scan";

const CHECK_TIMEOUT_MS = 8000;
const FETCH_TIMEOUT_MS = 8000;

const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function safeCategory(
  label: string,
  run: () => Promise<CategoryResult>
): Promise<CategoryResult> {
  try {
    return await withTimeout(run(), CHECK_TIMEOUT_MS, label);
  } catch (error) {
    return { ok: false, findings: [], data: {}, error: (error as Error).message };
  }
}

function highestSeverity(categories: ScanResult["categories"]): Severity | "none" {
  let highest: Severity | "none" = "none";
  for (const category of Object.values(categories)) {
    for (const finding of category.findings) {
      if (highest === "none" || SEVERITY_RANK[finding.severity] > SEVERITY_RANK[highest]) {
        highest = finding.severity;
      }
    }
  }
  return highest;
}

function buildSummary(categories: ScanResult["categories"]): string {
  const results = Object.values(categories);
  const failed = results.filter((c) => !c.ok);
  const all = results.flatMap((c) => c.findings);
  const critical = all.filter((f) => f.severity === "critical").length;
  const high = all.filter((f) => f.severity === "high").length;
  const actionable = all.filter((f) => f.severity !== "info").length;

  if (failed.length === results.length) {
    return `Scan could not complete: ${failed[0]?.error ?? "target unreachable"}`;
  }
  if (actionable === 0 && failed.length > 0) {
    return `No issues found in completed checks (${failed.length} check(s) could not run).`;
  }
  if (actionable === 0) return "No issues found.";
  if (critical > 0) return `${critical} critical issue(s) found`;
  if (high > 0) return `${high} high-severity issue(s) found`;
  return `${actionable} issue(s) found`;
}

export async function runScan(requestedUrl: string): Promise<ScanResult> {
  const hostname = new URL(requestedUrl).hostname;

  let headersResult: CategoryResult;
  let hostingResult: CategoryResult;
  let performanceResult: CategoryResult;
  let finalUrl = requestedUrl;

  try {
    const start = Date.now();
    const { response, finalUrl: resolvedUrl } = await withTimeout(
      safeFetch(requestedUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
      FETCH_TIMEOUT_MS,
      "fetch"
    );
    const ttfbMs = Date.now() - start;
    finalUrl = resolvedUrl;

    headersResult = scanHeaders(requestedUrl, finalUrl, response.headers);
    hostingResult = scanHosting(response.headers);
    performanceResult = scanPerformance(response.headers, ttfbMs);
  } catch (error) {
    const failure: CategoryResult = {
      ok: false,
      findings: [],
      data: {},
      error: (error as Error).message,
    };
    headersResult = failure;
    hostingResult = failure;
    performanceResult = failure;
  }

  const [tlsResult, dnsResult, whoisResult] = await Promise.all([
    safeCategory("tls", () => scanTls(hostname)),
    safeCategory("dns", () => scanDns(hostname)),
    safeCategory("whois", () => scanWhois(hostname)),
  ]);

  const categories: ScanResult["categories"] = {
    headers: headersResult,
    hosting: hostingResult,
    performance: performanceResult,
    tls: tlsResult,
    dns: dnsResult,
    whois: whoisResult,
  };

  return {
    requestedUrl,
    finalUrl,
    scannedAt: new Date().toISOString(),
    categories,
    overallSeverity: highestSeverity(categories),
    summary: buildSummary(categories),
  };
}
