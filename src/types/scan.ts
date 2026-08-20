import { z } from "zod";

export const scanRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .url("Must be a valid URL")
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "URL must start with http:// or https://",
    }),
});
export type ScanRequest = z.infer<typeof scanRequestSchema>;

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  severity: Severity;
  message: string;
}

export interface CategoryResult {
  ok: boolean;
  findings: Finding[];
  data: Record<string, unknown>;
  error?: string;
}

export type CategoryName = "headers" | "tls" | "dns" | "whois" | "hosting" | "performance";

export interface ScanResult {
  requestedUrl: string;
  finalUrl: string;
  scannedAt: string;
  categories: Record<CategoryName, CategoryResult>;
  overallSeverity: Severity | "none";
  summary: string;
}

// Lightweight record for the local (per-device) scan history list — a subset
// of ScanResult plus the share-link id, small enough to store many of in
// localStorage without re-fetching each full report just to list them.
export interface ScanSummary {
  id: string;
  requestedUrl: string;
  finalUrl: string;
  overallSeverity: Severity | "none";
  summary: string;
  scannedAt: string;
}
