import { publicResolver as resolver } from "@/lib/dns-resolver";
import type { CategoryResult, Finding } from "@/types/scan";

async function tryResolve<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function scanDns(hostname: string): Promise<CategoryResult> {
  const findings: Finding[] = [];

  const [a, aaaa, mx, ns, txt, cname] = await Promise.all([
    tryResolve(() => resolver.resolve4(hostname)),
    tryResolve(() => resolver.resolve6(hostname)),
    tryResolve(() => resolver.resolveMx(hostname)),
    tryResolve(() => resolver.resolveNs(hostname)),
    tryResolve(() => resolver.resolveTxt(hostname)),
    tryResolve(() => resolver.resolveCname(hostname)),
  ]);

  if (!a && !aaaa && !cname) {
    return {
      ok: false,
      findings,
      data: {},
      error: `Could not resolve any address records for ${hostname}`,
    };
  }

  if (!ns) {
    findings.push({ severity: "low", message: "No NS records found for this hostname" });
  }

  return {
    ok: true,
    findings,
    data: {
      a: a ?? [],
      aaaa: aaaa ?? [],
      mx: mx?.map((r) => `${r.exchange} (priority ${r.priority})`) ?? [],
      ns: ns ?? [],
      txt: txt?.map((chunks) => chunks.join("")) ?? [],
      cname: cname ?? [],
    },
  };
}
