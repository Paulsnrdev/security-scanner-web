export type LoadTestStatus = "RUNNING" | "COMPLETE" | "FAILED";

export interface LoadTestResult {
  requestsPerSecond: number;
  totalRequests: number;
  completedRequests: number;
  latencyMs: {
    mean: number;
    p50: number;
    p90: number;
    p99: number;
    max: number;
  };
  errors: number;
  timeouts: number;
  non2xx: number;
}

export interface LoadTestRecord {
  domain: string;
  config: { durationSeconds: number; connections: number };
  status: LoadTestStatus;
  result: LoadTestResult | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
