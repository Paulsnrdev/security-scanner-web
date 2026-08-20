import { UrlForm } from "@/components/scan/UrlForm";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Security Scanner
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Paste a URL to audit its security headers, TLS certificate, DNS, WHOIS, and
            hosting posture.
          </p>
        </div>
        <UrlForm />
      </main>
    </div>
  );
}
