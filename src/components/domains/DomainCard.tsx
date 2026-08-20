"use client";

import { useActionState } from "react";
import Link from "next/link";
import { verifyDomain, removeDomain, type DomainActionState } from "@/lib/actions/domain-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dnsTxtRecordName, verificationFileUrl } from "@/lib/verification/naming";
import type { DomainClaim } from "@/types/domain";

const initialState: DomainActionState = {};

const STATUS_STYLES: Record<DomainClaim["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  VERIFIED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export function DomainCard({ claim }: { claim: DomainClaim }) {
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyDomain, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeDomain, initialState);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{claim.domain}</span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[claim.status]}`}
        >
          {claim.status}
        </span>
      </div>

      {claim.status === "PENDING" && (
        <div className="space-y-1 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {claim.method === "DNS_TXT" ? (
            <>
              <p>Add a DNS TXT record named:</p>
              <p className="break-all font-mono text-zinc-900 dark:text-zinc-50">
                {dnsTxtRecordName(claim.domain)}
              </p>
              <p className="pt-1">with the value:</p>
              <p className="break-all font-mono text-zinc-900 dark:text-zinc-50">{claim.token}</p>
            </>
          ) : (
            <>
              <p>Upload a file at:</p>
              <p className="break-all font-mono text-zinc-900 dark:text-zinc-50">
                {verificationFileUrl(claim.domain)}
              </p>
              <p className="pt-1">containing exactly:</p>
              <p className="break-all font-mono text-zinc-900 dark:text-zinc-50">{claim.token}</p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {claim.status === "PENDING" && (
          <form action={verifyAction}>
            <input type="hidden" name="domain" value={claim.domain} />
            <Button type="submit" disabled={verifyPending}>
              {verifyPending ? "Verifying…" : "Verify"}
            </Button>
          </form>
        )}
        <form action={removeAction}>
          <input type="hidden" name="domain" value={claim.domain} />
          <Button type="submit" variant="ghost" disabled={removePending}>
            {removePending ? "Removing…" : "Remove"}
          </Button>
        </form>
        {claim.status === "VERIFIED" && (
          <Link
            href={`/domains/${claim.domain}/load-test`}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Load test →
          </Link>
        )}
      </div>

      {verifyState.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {verifyState.error}
        </p>
      )}
      {verifyState.message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{verifyState.message}</p>
      )}
      {removeState.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {removeState.error}
        </p>
      )}
    </Card>
  );
}
