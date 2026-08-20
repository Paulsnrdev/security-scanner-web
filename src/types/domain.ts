export type DomainVerifyMethod = "DNS_TXT" | "FILE_UPLOAD";
export type DomainVerifyStatus = "PENDING" | "VERIFIED";

export interface DomainClaim {
  domain: string;
  deviceId: string;
  method: DomainVerifyMethod;
  token: string;
  status: DomainVerifyStatus;
  createdAt: string;
  verifiedAt: string | null;
}

export interface VerificationResult {
  ok: boolean;
  error?: string;
}
