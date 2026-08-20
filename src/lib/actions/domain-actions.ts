"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getOrCreateDeviceId } from "@/lib/device-id";
import {
  createDomainClaim,
  getDomainClaim,
  markVerified,
  removeDomainClaim,
} from "@/lib/domain-store";
import { verifyDnsTxt } from "@/lib/verification/dns-txt";
import { verifyFileUpload } from "@/lib/verification/file-upload";

export interface DomainActionState {
  error?: string;
  message?: string;
}

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(
    /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
    "Enter a valid domain, e.g. example.com"
  );

const methodSchema = z.enum(["DNS_TXT", "FILE_UPLOAD"]);

const PENDING_LOCK_MS = 24 * 60 * 60 * 1000;

export async function addDomain(
  _prevState: DomainActionState,
  formData: FormData
): Promise<DomainActionState> {
  const domainResult = domainSchema.safeParse(formData.get("domain"));
  if (!domainResult.success) {
    return { error: domainResult.error.issues[0]?.message ?? "Invalid domain" };
  }

  const methodResult = methodSchema.safeParse(formData.get("method"));
  if (!methodResult.success) {
    return { error: "Invalid verification method" };
  }

  const domain = domainResult.data;
  const deviceId = await getOrCreateDeviceId();
  const existing = await getDomainClaim(domain);

  if (existing) {
    const isOwnClaim = existing.deviceId === deviceId;
    const isStale = Date.now() - new Date(existing.createdAt).getTime() >= PENDING_LOCK_MS;

    if (existing.status === "VERIFIED") {
      return isOwnClaim
        ? { message: "This domain is already verified." }
        : { error: "This domain is already verified by another user." };
    }

    // PENDING
    if (isOwnClaim) {
      return { message: "Verification already in progress — see instructions below." };
    }
    if (!isStale) {
      return {
        error: "This domain has a pending verification from another user. Try again later.",
      };
    }
    // Stale PENDING claim from someone else — fall through and let this device claim it.
  }

  const token = crypto.randomBytes(32).toString("hex");
  await createDomainClaim(domain, deviceId, methodResult.data, token);
  revalidatePath("/domains");
  return { message: "Domain added. Follow the instructions below to verify it." };
}

export async function verifyDomain(
  _prevState: DomainActionState,
  formData: FormData
): Promise<DomainActionState> {
  const domainResult = domainSchema.safeParse(formData.get("domain"));
  if (!domainResult.success) {
    return { error: "Invalid domain" };
  }

  const domain = domainResult.data;
  const deviceId = await getOrCreateDeviceId();
  const claim = await getDomainClaim(domain);

  if (!claim || claim.deviceId !== deviceId) {
    return { error: "No claim found for this domain on this device." };
  }
  if (claim.status === "VERIFIED") {
    return { message: "Already verified." };
  }

  const result =
    claim.method === "DNS_TXT"
      ? await verifyDnsTxt(domain, claim.token)
      : await verifyFileUpload(domain, claim.token);

  if (!result.ok) {
    return { error: result.error ?? "Verification failed." };
  }

  await markVerified(domain);
  revalidatePath("/domains");
  return { message: "Domain verified." };
}

export async function removeDomain(
  _prevState: DomainActionState,
  formData: FormData
): Promise<DomainActionState> {
  const domainResult = domainSchema.safeParse(formData.get("domain"));
  if (!domainResult.success) {
    return { error: "Invalid domain" };
  }

  const deviceId = await getOrCreateDeviceId();
  const removed = await removeDomainClaim(domainResult.data, deviceId);
  if (!removed) {
    return { error: "Could not remove domain (not found or not yours)." };
  }

  revalidatePath("/domains");
  return { message: "Domain removed." };
}
