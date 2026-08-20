"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToHistory } from "@/lib/scan-history";
import type { ScanSummary } from "@/types/scan";

type Status = "idle" | "loading" | "error";

export function UrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "Scan failed.");
        setStatus("error");
        return;
      }

      addToHistory(body as ScanSummary);
      router.push(`/scan/${body.id}`);
    } catch {
      setError("Could not reach the scanner. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="url" className="sr-only">
          Website URL
        </label>
        <Input
          id="url"
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={status === "loading"}
          required
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Scanning…" : "Scan"}
        </Button>
      </form>

      {status === "error" && error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
