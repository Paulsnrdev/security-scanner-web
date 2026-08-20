import type { Headers as UndiciHeaders } from "undici";
import type { CategoryResult, Finding } from "@/types/scan";

const PROVIDER_SIGNALS: Array<{ header: string; provider: string }> = [
  { header: "cf-ray", provider: "Cloudflare" },
  { header: "x-vercel-id", provider: "Vercel" },
  { header: "x-amz-cf-id", provider: "Amazon CloudFront" },
  { header: "x-amz-cf-pop", provider: "Amazon CloudFront" },
  { header: "x-github-request-id", provider: "GitHub Pages" },
  { header: "x-fastly-request-id", provider: "Fastly" },
  { header: "fastly-io-info", provider: "Fastly" },
  { header: "x-served-by", provider: "Fastly" },
  { header: "x-netlify-id", provider: "Netlify" },
];

export function scanHosting(headers: UndiciHeaders): CategoryResult {
  const findings: Finding[] = [];
  const providers = new Set<string>();

  for (const { header, provider } of PROVIDER_SIGNALS) {
    if (headers.get(header)) providers.add(provider);
  }

  const server = headers.get("server");
  const poweredBy = headers.get("x-powered-by");

  if (server && /\d/.test(server)) {
    findings.push({
      severity: "low",
      message: `Server header discloses version info: "${server}"`,
    });
  }

  if (poweredBy) {
    findings.push({
      severity: "low",
      message: `X-Powered-By header discloses backend technology: "${poweredBy}"`,
    });
  }

  return {
    ok: true,
    findings,
    data: {
      providers: [...providers],
      server: server ?? null,
      poweredBy: poweredBy ?? null,
    },
  };
}
