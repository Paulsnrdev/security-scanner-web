import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";
import type { CategoryName, CategoryResult, ScanResult } from "@/types/scan";

const CATEGORY_LABELS: Record<CategoryName, string> = {
  headers: "Security headers",
  tls: "TLS / SSL",
  dns: "DNS records",
  whois: "WHOIS",
  hosting: "Hosting & CDN",
  performance: "Performance",
};

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function CategoryCard({ name, result }: { name: CategoryName; result: CategoryResult }) {
  const dataEntries = Object.entries(result.data);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {CATEGORY_LABELS[name]}
        </h3>
        {!result.ok && <SeverityBadge severity="high" />}
      </div>

      {result.error && (
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{result.error}</p>
      )}

      {result.findings.length > 0 && (
        <ul className="mb-3 space-y-2">
          {result.findings.map((finding, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <SeverityBadge severity={finding.severity} />
              <span className="text-zinc-700 dark:text-zinc-300">{finding.message}</span>
            </li>
          ))}
        </ul>
      )}

      {result.findings.length === 0 && !result.error && (
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">No issues found.</p>
      )}

      {dataEntries.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
          {dataEntries.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{key}</dt>
              <dd className="text-right break-all text-zinc-700 dark:text-zinc-300">
                {renderValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

export function ReportView({ result }: { result: ScanResult }) {
  const categoryNames = Object.keys(result.categories) as CategoryName[];

  return (
    <div className="w-full space-y-4">
      <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Scan result for</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{result.finalUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={result.overallSeverity} />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{result.summary}</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categoryNames.map((name) => (
          <CategoryCard key={name} name={name} result={result.categories[name]} />
        ))}
      </div>
    </div>
  );
}
