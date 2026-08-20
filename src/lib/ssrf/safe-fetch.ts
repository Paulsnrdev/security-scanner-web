import type { LookupFunction } from "node:net";
import { Agent, fetch as undiciFetch, type RequestInit, type Response } from "undici";
import { checkUrlIsPublic } from "./guard";

const MAX_REDIRECTS = 5;
const CONNECT_TIMEOUT_MS = 5000;

/**
 * Forces the connector to open a socket to the exact IP we already validated,
 * instead of letting undici re-resolve the hostname at connect time. This is
 * what closes the DNS-rebinding gap: without it, a hostname could resolve to
 * a public IP during the SSRF check and a private one microseconds later when
 * the socket actually opens.
 */
function pinnedLookup(ip: string): LookupFunction {
  const family = ip.includes(":") ? 6 : 4;
  // Node's Happy Eyeballs connector (autoSelectFamily) calls lookup with
  // { all: true } and expects an array back, while a plain connect calls it
  // with the single-address callback shape — the LookupFunction type only
  // describes the latter, so handle both at runtime.
  return ((_hostname: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => {
    if (options?.all) {
      callback(null, [{ address: ip, family }]);
    } else {
      callback(null, ip, family);
    }
  }) as LookupFunction;
}

export interface SafeFetchResult {
  response: Response;
  finalUrl: string;
}

export async function safeFetch(rawUrl: string, init?: RequestInit): Promise<SafeFetchResult> {
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const check = await checkUrlIsPublic(currentUrl);
    if (!check.ok || !check.resolvedIps?.length) {
      throw new Error(check.reason ?? `URL failed SSRF validation: ${currentUrl}`);
    }

    const agent = new Agent({
      connect: {
        lookup: pinnedLookup(check.resolvedIps[0]),
        autoSelectFamily: false,
        timeout: CONNECT_TIMEOUT_MS,
      },
    });

    const response = await undiciFetch(currentUrl, {
      ...init,
      redirect: "manual",
      dispatcher: agent,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { response, finalUrl: currentUrl };
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new Error(`Too many redirects (>${MAX_REDIRECTS}) starting from ${rawUrl}`);
}
