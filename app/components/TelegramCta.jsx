"use client";

const CLICK_DEBOUNCE_MS = 3000;

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

export default function TelegramCta({ href }) {
  function handleClick() {
    const storageKey = "ajb_last_telegram_click_at";
    const now = Date.now();
    const previous = Number(window.localStorage.getItem(storageKey) ?? "0");

    if (now - previous < CLICK_DEBOUNCE_MS) {
      return;
    }

    window.localStorage.setItem(storageKey, String(now));

    sendTelegramClick({
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
