import { requireRedis } from "./redis";
import type { DomainClaim, DomainVerifyMethod } from "@/types/domain";

const PENDING_TTL_SECONDS = 60 * 60 * 24; // 24h — abandoned claims free themselves up

const claimKey = (domain: string) => `domain:${domain}`;
const deviceDomainsKey = (deviceId: string) => `device:${deviceId}:domains`;

export async function getDomainClaim(domain: string): Promise<DomainClaim | null> {
  return requireRedis().get<DomainClaim>(claimKey(domain));
}

export async function createDomainClaim(
  domain: string,
  deviceId: string,
  method: DomainVerifyMethod,
  token: string
): Promise<DomainClaim> {
  const redis = requireRedis();
  const claim: DomainClaim = {
    domain,
    deviceId,
    method,
    token,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    verifiedAt: null,
  };
  await redis.set(claimKey(domain), claim, { ex: PENDING_TTL_SECONDS });
  await redis.sadd(deviceDomainsKey(deviceId), domain);
  return claim;
}

export async function markVerified(domain: string): Promise<DomainClaim> {
  const existing = await getDomainClaim(domain);
  if (!existing) throw new Error(`No claim found for ${domain}`);

  const updated: DomainClaim = {
    ...existing,
    status: "VERIFIED",
    verifiedAt: new Date().toISOString(),
  };
  // No `ex` option — a plain SET clears the PENDING claim's TTL, so a
  // verified claim persists indefinitely.
  await requireRedis().set(claimKey(domain), updated);
  return updated;
}

export async function listDeviceDomains(deviceId: string): Promise<DomainClaim[]> {
  const redis = requireRedis();
  const domains = await redis.smembers<string[]>(deviceDomainsKey(deviceId));
  if (domains.length === 0) return [];

  const claims = await Promise.all(domains.map((domain) => getDomainClaim(domain)));
  return claims.filter((claim): claim is DomainClaim => claim !== null);
}

export async function removeDomainClaim(domain: string, deviceId: string): Promise<boolean> {
  const existing = await getDomainClaim(domain);
  if (!existing || existing.deviceId !== deviceId) return false;

  const redis = requireRedis();
  await redis.del(claimKey(domain));
  await redis.srem(deviceDomainsKey(deviceId), domain);
  return true;
}
