// Sized to fit inside a single Vercel serverless function invocation without
// needing a queue/worker. Bump these only with a matching look at
// `maxDuration` on src/app/api/load-test/route.ts.
export const LOAD_TEST_DURATION_SECONDS = 10;
export const LOAD_TEST_CONNECTIONS = 10;
export const LOAD_TEST_RATE_LIMIT_WINDOW = "1 h";
export const LOAD_TEST_RECORD_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days, matches scan-store.ts
