"use client";

import { useActionState } from "react";
import { addDomain, type DomainActionState } from "@/lib/actions/domain-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: DomainActionState = {};

export function AddDomainForm() {
  const [state, formAction, isPending] = useActionState(addDomain, initialState);

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="domain"
            className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Domain
          </label>
          <Input id="domain" name="domain" placeholder="example.com" required disabled={isPending} />
        </div>

        <div>
          <label
            htmlFor="method"
            className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Method
          </label>
          <select
            id="method"
            name="method"
            disabled={isPending}
            defaultValue="DNS_TXT"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-auto"
          >
            <option value="DNS_TXT">DNS TXT record</option>
            <option value="FILE_UPLOAD">File upload</option>
          </select>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add domain"}
        </Button>
      </form>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{state.message}</p>
      )}
    </Card>
  );
}
