import { publicResolver } from "@/lib/dns-resolver";
import { dnsTxtRecordName } from "./naming";
import type { VerificationResult } from "@/types/domain";

export async function verifyDnsTxt(domain: string, token: string): Promise<VerificationResult> {
  const recordName = dnsTxtRecordName(domain);
  try {
    const records = await publicResolver.resolveTxt(recordName);
    const values = records.map((chunks) => chunks.join(""));
    if (values.includes(token)) return { ok: true };
    return { ok: false, error: `TXT record at ${recordName} was found but did not match` };
  } catch (error) {
    return { ok: false, error: `Could not resolve ${recordName}: ${(error as Error).message}` };
  }
}
