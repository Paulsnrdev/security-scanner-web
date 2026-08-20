"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LoadTestRecord } from "@/types/load-test";

type Status = "idle" | "running" | "error";

export function LoadTestPanel({
  domain,
  initialRecord,
}: {
  domain: string;
  initialRecord: LoadTestRecord | null;
}) {
  const [record, setRecord] = useState<LoadTestRecord | null>(initialRecord);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setStatus("running");
    setError(null);

    try {
      const response = await fetch("/api/load-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "Load test failed.");
        setStatus("error");
        return;
      }

      setRecord(body as LoadTestRecord);
      setStatus("idle");
    } catch {
      setError("Could not reach the server. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This sends real traffic to{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{domain}</span> for
          about 10 seconds. Only run this against a site you own and are prepared to load test.
        </p>
        <Button onClick={handleRun} disabled={status === "running"}>
          {status === "running" ? "Running…" : "Run load test"}
        </Button>
      </Card>

      {status === "error" && error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {record?.status === "COMPLETE" && record.result && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Results</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Stat label="Requests/sec" value={record.result.requestsPerSecond} />
            <Stat label="Total requests" value={record.result.totalRequests} />
            <Stat label="Completed" value={record.result.completedRequests} />
            <Stat label="Latency mean" value={`${record.result.latencyMs.mean} ms`} />
            <Stat label="Latency p90" value={`${record.result.latencyMs.p90} ms`} />
            <Stat label="Latency p99" value={`${record.result.latencyMs.p99} ms`} />
            <Stat label="Errors" value={record.result.errors} />
            <Stat label="Timeouts" value={record.result.timeouts} />
            <Stat label="Non-2xx" value={record.result.non2xx} />
          </dl>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Last run {new Date(record.completedAt ?? record.createdAt).toLocaleString()}
          </p>
        </Card>
      )}

      {record?.status === "FAILED" && (
        <Card className="text-sm text-red-600 dark:text-red-400">
          Last run failed: {record.error}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium text-zinc-900 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
