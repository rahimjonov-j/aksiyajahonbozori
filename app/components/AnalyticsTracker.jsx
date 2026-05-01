"use client";

import { useEffect } from "react";

const VISIT_DEBOUNCE_MS = 20000;

export default function AnalyticsTracker() {
  useEffect(() => {
    const storageKey = "ajb_last_visit_track_at";
    const now = Date.now();
    const previous = Number(window.sessionStorage.getItem(storageKey) ?? "0");

    if (now - previous < VISIT_DEBOUNCE_MS) {
      return;
    }

    window.sessionStorage.setItem(storageKey, String(now));

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      keepalive: true,
      body: JSON.stringify({
        pathname: window.location.pathname,
        referrer: document.referrer,
      }),
    }).catch(() => {});
  }, []);

  return null;
}
