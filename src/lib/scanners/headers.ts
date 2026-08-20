import type { Headers as UndiciHeaders } from "undici";
import type { CategoryResult, Finding } from "@/types/scan";

const REQUIRED_HEADERS = [
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "content-security-policy",
] as const;

export function scanHeaders(
  requestedUrl: string,
  finalUrl: string,
  headers: UndiciHeaders
): CategoryResult {
  const findings: Finding[] = [];
  const present: Record<string, string> = {};

  for (const name of REQUIRED_HEADERS) {
    const value = headers.get(name);
    if (value) {
      present[name] = value;
    } else {
      findings.push({ severity: "medium", message: `Missing security header: ${name}` });
    }
  }

  const requestedProtocol = new URL(requestedUrl).protocol;
  const finalProtocol = new URL(finalUrl).protocol;

  if (requestedProtocol === "http:" && finalProtocol !== "https:") {
    findings.push({ severity: "critical", message: "Site does not redirect HTTP to HTTPS" });
  }

  return {
    ok: true,
    findings,
    data: { presentHeaders: present, redirectedToHttps: finalProtocol === "https:" },
  };
}
