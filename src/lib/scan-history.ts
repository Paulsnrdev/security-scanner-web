import type { ScanSummary } from "@/types/scan";

const HISTORY_KEY = "security-scanner:history";
const MAX_HISTORY_ITEMS = 20;

export function getHistory(): ScanSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: ScanSummary): void {
  if (typeof window === "undefined") return;
  const existing = getHistory().filter((item) => item.id !== entry.id);
  const updated = [entry, ...existing].slice(0, MAX_HISTORY_ITEMS);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
}
