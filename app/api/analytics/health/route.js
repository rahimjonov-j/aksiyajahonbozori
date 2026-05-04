import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const analytics = await getAnalyticsSnapshot();

    return NextResponse.json({
      ok: !analytics.storage?.degraded,
      storage: analytics.storage,
      summary: analytics.summary,
      last7Days: analytics.last7Days,
    });
  } catch (error) {
    console.error("[analytics] health check failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "analytics_health_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
