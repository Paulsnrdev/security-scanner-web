import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Security Scanner
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/domains"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Domains
          </Link>
          <Link
            href="/history"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
