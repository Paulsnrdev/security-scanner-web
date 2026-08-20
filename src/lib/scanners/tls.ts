import tls from "node:tls";
import { checkUrlIsPublic } from "../ssrf/guard";
import type { CategoryResult, Finding } from "@/types/scan";

const CONNECT_TIMEOUT_MS = 5000;
const EXPIRY_WARNING_DAYS = 30;
const WEAK_PROTOCOLS = new Set(["TLSv1", "TLSv1.1"]);

interface TlsInfo {
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  protocol: string | null;
  cipher: string;
  authorized: boolean;
  authorizationError: string | null;
}

function connectTls(host: string, ip: string): Promise<TlsInfo> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: ip,
        servername: host,
        port: 443,
        timeout: CONNECT_TIMEOUT_MS,
        // We want to inspect and report a bad cert, not have the connection
        // throw on it — findings below classify what's wrong instead.
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const cipher = socket.getCipher();
        const info: TlsInfo = {
          issuer: cert.issuer ? Object.values(cert.issuer).join(", ") : "unknown",
          subject: cert.subject ? Object.values(cert.subject).join(", ") : "unknown",
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          protocol: socket.getProtocol(),
          cipher: cipher?.name ?? "unknown",
          authorized: socket.authorized,
          authorizationError: socket.authorized ? null : String(socket.authorizationError ?? "unknown"),
        };
        socket.end();
        resolve(info);
      }
    );

    socket.once("error", reject);
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("TLS connection timed out"));
    });
  });
}

export async function scanTls(hostname: string): Promise<CategoryResult> {
  const findings: Finding[] = [];

  const check = await checkUrlIsPublic(`https://${hostname}`);
  if (!check.ok || !check.resolvedIps?.length) {
    return { ok: false, findings, data: {}, error: check.reason ?? "SSRF check failed" };
  }

  let info: TlsInfo;
  try {
    info = await connectTls(hostname, check.resolvedIps[0]);
  } catch (error) {
    return {
      ok: false,
      findings,
      data: {},
      error: `Could not establish a TLS connection on port 443: ${(error as Error).message}`,
    };
  }

  if (!info.authorized) {
    findings.push({
      severity: "high",
      message: `TLS certificate is not valid: ${info.authorizationError}`,
    });
  }

  const validTo = new Date(info.validTo);
  if (!Number.isNaN(validTo.getTime())) {
    const daysUntilExpiry = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) {
      findings.push({ severity: "critical", message: "TLS certificate has expired" });
    } else if (daysUntilExpiry < EXPIRY_WARNING_DAYS) {
      findings.push({
        severity: "high",
        message: `TLS certificate expires in ${daysUntilExpiry} day(s)`,
      });
    }
  }

  if (info.protocol && WEAK_PROTOCOLS.has(info.protocol)) {
    findings.push({ severity: "medium", message: `Weak TLS protocol in use: ${info.protocol}` });
  }

  return { ok: true, findings, data: { ...info } };
}
