import type { Severity } from "@/types/scan";

const SEVERITY_STYLES: Record<Severity | "none", string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  info: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  none: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export function SeverityBadge({ severity }: { severity: Severity | "none" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${SEVERITY_STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}
