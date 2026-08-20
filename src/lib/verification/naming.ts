// Pure string helpers with no server-only imports (node:dns, undici) — safe
// to import from both the server-side verification checks and client
// components that just need to *display* the expected record/file location.

export function dnsTxtRecordName(domain: string): string {
  return `_security-scanner-verify.${domain}`;
}

export function verificationFileUrl(domain: string): string {
  return `https://${domain}/.well-known/security-scanner-verify.txt`;
}
