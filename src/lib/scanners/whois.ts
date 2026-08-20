import { whoisDomain, firstResult } from "whoiser";
import type { CategoryResult, Finding } from "@/types/scan";

const EXPIRY_WARNING_DAYS = 30;

function asString(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

export async function scanWhois(hostname: string): Promise<CategoryResult> {
  const findings: Finding[] = [];

  let record;
  try {
    const result = await whoisDomain(hostname, { follow: 2, timeout: 5000 });
    record = firstResult(result);
  } catch (error) {
    return {
      ok: false,
      findings,
      data: {},
      error: `WHOIS lookup failed: ${(error as Error).message}`,
    };
  }

  const registrar = asString(record["Registrar"]);
  const createdDate = asString(record["Created Date"]);
  const expiryDate = asString(record["Expiry Date"]);
  const nameServers = record["Name Server"];

  if (expiryDate) {
    const expiry = new Date(expiryDate);
    if (!Number.isNaN(expiry.getTime())) {
      const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) {
        findings.push({ severity: "critical", message: "Domain registration has expired" });
      } else if (daysUntilExpiry < EXPIRY_WARNING_DAYS) {
        findings.push({
          severity: "high",
          message: `Domain registration expires in ${daysUntilExpiry} day(s)`,
        });
      }
    }
  }

  return {
    ok: true,
    findings,
    data: {
      registrar,
      createdDate,
      expiryDate,
      nameServers: Array.isArray(nameServers) ? nameServers : nameServers ? [nameServers] : [],
    },
  };
}
