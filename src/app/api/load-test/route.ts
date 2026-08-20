import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomainClaim } from "@/lib/domain-store";
import { getDeviceId } from "@/lib/device-id";
import { checkLoadTestRateLimit } from "@/lib/rate-limit";
import { runLoadTest } from "@/lib/load-test-runner";
import { saveLoadTestRecord } from "@/lib/load-test-store";
import { LOAD_TEST_DURATION_SECONDS, LOAD_TEST_CONNECTIONS } from "@/lib/constants";
import type { LoadTestRecord } from "@/types/load-test";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({ domain: z.string().trim().toLowerCase().max(253) });

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }
  const { domain } = parsed.data;

  const deviceId = await getDeviceId();
  const claim = deviceId ? await getDomainClaim(domain) : null;

  if (!claim) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }
  if (claim.status !== "VERIFIED") {
    return NextResponse.json({ error: "Domain is not verified." }, { status: 403 });
  }
  if (claim.deviceId !== deviceId) {
    return NextResponse.json(
      { error: "This domain was verified by a different device." },
      { status: 403 }
    );
  }

  const rateLimit = await checkLoadTestRateLimit(domain);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "This domain was load tested recently. Please wait before trying again." },
      { status: 429 }
    );
  }

  const createdAt = new Date().toISOString();
  const config = { durationSeconds: LOAD_TEST_DURATION_SECONDS, connections: LOAD_TEST_CONNECTIONS };

  try {
    const result = await runLoadTest(domain);
    const record: LoadTestRecord = {
      domain,
      config,
      status: "COMPLETE",
      result,
      error: null,
      createdAt,
      completedAt: new Date().toISOString(),
    };
    await saveLoadTestRecord(record);
    return NextResponse.json(record);
  } catch (error) {
    const record: LoadTestRecord = {
      domain,
      config,
      status: "FAILED",
      result: null,
      error: (error as Error).message,
      createdAt,
      completedAt: new Date().toISOString(),
    };
    await saveLoadTestRecord(record);
    return NextResponse.json(record, { status: 502 });
  }
}
