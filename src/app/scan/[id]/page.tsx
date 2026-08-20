import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/scan/ReportView";
import { getScan } from "@/lib/scan-store";

export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScanResultPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getScan(id);

  if (!result) notFound();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Scan another URL
        </Link>
        <ReportView result={result} />
      </main>
    </div>
  );
}
