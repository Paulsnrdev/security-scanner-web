"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { getHistory, clearHistory } from "@/lib/scan-history";
import type { ScanSummary } from "@/types/scan";

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanSummary[] | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Scan history
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Stored only in this browser — not tied to an account.
            </p>
          </div>
          {history && history.length > 0 && (
            <Button variant="ghost" onClick={handleClear}>
              Clear history
            </Button>
          )}
        </div>

        {history === null && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        )}

        {history !== null && history.length === 0 && (
          <Card className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            No scans yet.{" "}
            <Link href="/" className="font-medium text-zinc-900 underline dark:text-zinc-50">
              Scan a URL
            </Link>{" "}
            to get started.
          </Card>
        )}

        {history !== null && history.length > 0 && (
          <ul className="space-y-3">
            {history.map((entry) => (
              <li key={entry.id}>
                <Link href={`/scan/${entry.id}`}>
                  <Card className="flex flex-col gap-2 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {entry.finalUrl}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(entry.scannedAt).toLocaleString()} · {entry.summary}
                      </p>
                    </div>
                    <SeverityBadge severity={entry.overallSeverity} />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
