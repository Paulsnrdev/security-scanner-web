import { NextRequest, NextResponse } from "next/server";
import { scanRequestSchema, type ScanSummary } from "@/types/scan";
import { runScan } from "@/lib/scan-runner";
import { checkScanRateLimit } from "@/lib/rate-limit";
import { saveScan } from "@/lib/scan-store";

export const runtime = "nodejs";
export const maxDuration = 30;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkScanRateLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many scan requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = scanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const result = await runScan(parsed.data.url);
    const id = await saveScan(result);
    const summary: ScanSummary = {
      id,
      requestedUrl: result.requestedUrl,
      finalUrl: result.finalUrl,
      overallSeverity: result.overallSeverity,
      summary: result.summary,
      scannedAt: result.scannedAt,
    };
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: `Scan failed: ${(error as Error).message}` },
      { status: 502 }
    );
  }
}
