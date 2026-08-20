import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";

const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

export interface SsrfCheckResult {
  ok: boolean;
  reason?: string;
  resolvedIps?: string[];
}

/**
 * Only "unicast" is a globally-routable public address in ipaddr.js's
 * classification, for both IPv4 and IPv6 — everything else (private,
 * loopback, link-local incl. 169.254.169.254 cloud metadata, unique-local,
 * multicast, reserved, tunneling ranges, etc.) is rejected by default.
 */
function isPublicAddress(address: string): boolean {
  let addr: ReturnType<typeof ipaddr.parse>;
  try {
    addr = ipaddr.parse(address);
  } catch {
    return false;
  }

  if (addr instanceof ipaddr.IPv6 && addr.range() === "ipv4Mapped") {
    addr = addr.toIPv4Address();
  }

  return addr.range() === "unicast";
}

export async function checkUrlIsPublic(rawUrl: string): Promise<SsrfCheckResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (!ALLOWED_SCHEMES.has(url.protocol)) {
    return { ok: false, reason: `Unsupported scheme: ${url.protocol}` };
  }

  const hostname = url.hostname;
  let addresses: string[];

  if (ipaddr.isValid(hostname)) {
    addresses = [hostname];
  } else {
    try {
      const results = await dns.lookup(hostname, { all: true, verbatim: true });
      addresses = results.map((r) => r.address);
    } catch {
      return { ok: false, reason: `Could not resolve hostname: ${hostname}` };
    }
  }

  if (addresses.length === 0) {
    return { ok: false, reason: `No addresses resolved for ${hostname}` };
  }

  for (const address of addresses) {
    if (!isPublicAddress(address)) {
      return {
        ok: false,
        reason: `Blocked non-public address: ${address}`,
        resolvedIps: addresses,
      };
    }
  }

  return { ok: true, resolvedIps: addresses };
}
