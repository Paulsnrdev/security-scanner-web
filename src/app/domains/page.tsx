import { getDeviceId } from "@/lib/device-id";
import { listDeviceDomains } from "@/lib/domain-store";
import { AddDomainForm } from "@/components/domains/AddDomainForm";
import { DomainCard } from "@/components/domains/DomainCard";
import { Card } from "@/components/ui/card";

export const runtime = "nodejs";

export default async function DomainsPage() {
  const deviceId = await getDeviceId();
  const domains = deviceId ? await listDeviceDomains(deviceId) : [];

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Verified domains
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Prove you control a domain to unlock load testing against it. Tied to this
            browser only — no account required.
          </p>
        </div>

        <AddDomainForm />

        {domains.length === 0 ? (
          <Card className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            No domains added yet.
          </Card>
        ) : (
          <ul className="space-y-3">
            {domains.map((claim) => (
              <li key={claim.domain}>
                <DomainCard claim={claim} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
