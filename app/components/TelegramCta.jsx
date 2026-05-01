"use client";

import { useEffect, useMemo } from "react";
import { getOrCreateClientVisitorId } from "./analytics-client";

const CLICK_DEBOUNCE_MS = 3000;
const OPEN_SIGNAL_WINDOW_MS = 15000;
const TELEGRAM_PENDING_KEY = "ajb_pending_telegram_open";

function sendTelegramClick(payload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/telegram", blob);
    return;
  }

  void fetch("/api/analytics/telegram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    body,
  }).catch(() => {});
}

function sendTelegramOpenLikely(payload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/telegram-open", blob);
    return;
  }

  void fetch("/api/analytics/telegram-open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    body,
  }).catch(() => {});
}

function readPendingOpenSignal() {
  try {
    const raw = window.sessionStorage.getItem(TELEGRAM_PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePendingOpenSignal(value) {
  window.sessionStorage.setItem(TELEGRAM_PENDING_KEY, JSON.stringify(value));
}

export default function TelegramCta({ botUsername, startPrefix }) {
  const visitorId = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return getOrCreateClientVisitorId();
  }, []);

  const href = useMemo(() => {
    const startPayload = visitorId
      ? `${startPrefix}_v_${visitorId}`
      : startPrefix;

    return `https://t.me/${botUsername}?start=${encodeURIComponent(startPayload)}`;
  }, [botUsername, startPrefix, visitorId]);

  useEffect(() => {
    function flushOpenSignal() {
      const pending = readPendingOpenSignal();

      if (!pending || pending.sent) {
        return;
      }

      if (Date.now() - pending.at > OPEN_SIGNAL_WINDOW_MS) {
        window.sessionStorage.removeItem(TELEGRAM_PENDING_KEY);
        return;
      }

      pending.sent = true;
      writePendingOpenSignal(pending);

      sendTelegramOpenLikely({
        visitorId: pending.visitorId,
        pathname: pending.pathname,
        referrer: pending.referrer,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushOpenSignal();
      }
    }

    function handlePageHide() {
      flushOpenSignal();
    }

    const pending = readPendingOpenSignal();

    if (pending && Date.now() - pending.at > OPEN_SIGNAL_WINDOW_MS) {
      window.sessionStorage.removeItem(TELEGRAM_PENDING_KEY);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  function handleClick() {
    const storageKey = "ajb_last_telegram_click_at";
    const now = Date.now();
    const previous = Number(window.localStorage.getItem(storageKey) ?? "0");

    if (now - previous < CLICK_DEBOUNCE_MS) {
      return;
    }

    window.localStorage.setItem(storageKey, String(now));

    writePendingOpenSignal({
      at: now,
      pathname: window.location.pathname,
      referrer: document.referrer,
      visitorId,
      sent: false,
    });

    sendTelegramClick({
      visitorId,
      pathname: window.location.pathname,
      referrer: document.referrer,
    });
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="w-full rounded-[1.35rem] bg-[linear-gradient(135deg,#34d058,#16a34a,#0f7a34)] px-5 py-4 text-center text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-[0_18px_44px_rgba(22,163,74,0.38)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 animate-pulse min-[380px]:text-sm md:max-w-sm md:py-5 md:text-lg md:tracking-[0.08em]"
    >
      AKSIYADA QATNASHISH
    </a>
  );
}
