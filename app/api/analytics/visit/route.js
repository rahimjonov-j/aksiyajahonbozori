import { NextResponse } from "next/server";
import {
  ANALYTICS_VISITOR_COOKIE,
  createVisitorId,
  trackVisit,
} from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readPayload(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function POST(request) {
  const payload = await readPayload(request);
  const existingVisitorId = request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || createVisitorId();

  try {
    await trackVisit(visitorId, {
      pathname: payload.pathname,
      referrer: payload.referrer,
      userAgent: request.headers.get("user-agent"),
    });
  } catch {}

  const response = NextResponse.json({ ok: true });

  if (!existingVisitorId) {
    response.cookies.set({
      name: ANALYTICS_VISITOR_COOKIE,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
