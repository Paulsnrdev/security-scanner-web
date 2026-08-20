import { safeFetch } from "@/lib/ssrf/safe-fetch";
import { verificationFileUrl } from "./naming";
import type { VerificationResult } from "@/types/domain";

const FETCH_TIMEOUT_MS = 5000;

export async function verifyFileUpload(domain: string, token: string): Promise<VerificationResult> {
  const url = verificationFileUrl(domain);
  try {
    const { response } = await safeFetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      return { ok: false, error: `Could not fetch ${url}: HTTP ${response.status}` };
    }
    const body = (await response.text()).trim();
    if (body === token) return { ok: true };
    return { ok: false, error: `File at ${url} was found but its contents did not match` };
  } catch (error) {
    return { ok: false, error: `Could not fetch ${url}: ${(error as Error).message}` };
  }
}
