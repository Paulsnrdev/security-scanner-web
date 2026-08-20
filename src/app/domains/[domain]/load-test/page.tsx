import { redirect } from "next/navigation";
import { getDeviceId } from "@/lib/device-id";
import { getDomainClaim } from "@/lib/domain-store";
import { getLoadTestRecord } from "@/lib/load-test-store";
import { LOAD_TEST_DURATION_SECONDS } from "@/lib/constants";
import { LoadTestPanel } from "@/components/domains/LoadTestPanel";

export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ domain: string }>;
}

export default async function LoadTestPage({ params }: PageProps) {
  const { domain } = await params;
  const deviceId = await getDeviceId();
  const claim = deviceId ? await getDomainClaim(domain) : null;

  if (!claim || claim.status !== "VERIFIED" || claim.deviceId !== deviceId) {
    redirect("/domains");
  }

  const existingRecord = await getLoadTestRecord(domain);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Load test — {domain}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sends real concurrent traffic to this domain for about{" "}
            {LOAD_TEST_DURATION_SECONDS} seconds.
          </p>
        </div>
        <LoadTestPanel domain={domain} initialRecord={existingRecord} />
      </main>
    </div>
  );
}
