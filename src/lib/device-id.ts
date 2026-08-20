import { cookies } from "next/headers";

const COOKIE_NAME = "scanner_device_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year

// Only callable from a Server Action or Route Handler — Next.js only allows
// cookie mutation there, not during a Server Component render.
export async function getOrCreateDeviceId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return id;
}

// Read-only variant for Server Components (e.g. listing existing claims) —
// cannot create the cookie there, only read it if a Server Action already set it.
export async function getDeviceId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}
