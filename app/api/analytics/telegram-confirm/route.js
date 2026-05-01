import { NextResponse } from "next/server";
import {
  extractVisitorIdFromTelegramStart,
  trackTelegramConfirmedStart,
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

function isAuthorized(request) {
  const configuredSecret = process.env.BOT_CONFIRM_SECRET?.trim();

  if (!configuredSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-bot-confirm-secret")?.trim();
  return headerSecret === configuredSecret;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const payload = await readPayload(request);
  const visitorId =
    extractVisitorIdFromTelegramStart(payload.startPayload) ||
    extractVisitorIdFromTelegramStart(payload.start) ||
    null;

  if (!visitorId) {
    return NextResponse.json(
      { ok: false, error: "invalid_start_payload" },
      { status: 400 },
    );
  }

  try {
    await trackTelegramConfirmedStart(visitorId, {
      pathname: "/telegram-start",
      referrer: "telegram-bot",
      userAgent: request.headers.get("user-agent") || "telegram-bot",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "tracking_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
