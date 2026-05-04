import { NextResponse } from "next/server";
import {
  ANALYTICS_VISITOR_COOKIE,
  ANALYTICS_VISITOR_PUBLIC_COOKIE,
  createVisitorId,
  isValidVisitorId,
  trackTelegramOpenLikely,
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
  const requestedVisitorId = isValidVisitorId(payload.visitorId)
    ? payload.visitorId
    : null;
  const visitorId = existingVisitorId || requestedVisitorId || createVisitorId();
  let trackingError = null;

  try {
    await trackTelegramOpenLikely(visitorId, {
      pathname: payload.pathname,
      referrer: payload.referrer,
      userAgent: request.headers.get("user-agent"),
    });
  } catch (error) {
    trackingError = error;
    console.error("[analytics] telegram open tracking failed", error);
  }

  const response = trackingError
    ? NextResponse.json({
        ok: true,
        degraded: true,
        error: trackingError.code ?? "analytics_unavailable",
        details: trackingError.details ?? null,
      })
    : NextResponse.json({ ok: true });

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

  response.cookies.set({
    name: ANALYTICS_VISITOR_PUBLIC_COOKIE,
    value: visitorId,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
