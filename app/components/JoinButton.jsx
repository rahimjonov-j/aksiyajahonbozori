"use client";

export default function JoinButton() {
  function handleClick() {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "join_click", {
        event_category: "engagement",
        event_label: "Telegram qo'shilish tugmasi",
        link_url: "https://t.me/jahonbozorivodiy",
      });
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <a
        href="https://t.me/jahonbozorivodiy"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="cta-glow cta-shine relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-[1.35rem] bg-[linear-gradient(135deg,#edc55e,#d9a520,#b8841a)] px-5 py-4 text-center text-[13px] font-black uppercase tracking-[0.06em] text-[#050505] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 min-[380px]:text-sm md:max-w-sm md:py-5 md:text-lg md:tracking-[0.08em]"
      >
        <span className="cta-fly inline-flex shrink-0">
          <svg
            className="h-5 w-5 md:h-6 md:w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M21.94 4.3 18.6 19.1c-.25 1.1-.92 1.37-1.86.85l-5.13-3.78-2.48 2.38c-.27.27-.5.5-1.03.5l.37-5.21 9.5-8.58c.41-.37-.09-.57-.64-.2L5.07 12.4l-5.06-1.58c-1.1-.34-1.12-1.1.23-1.62L20.5 2.84c.92-.34 1.72.2 1.44 1.46Z" />
          </svg>
        </span>
        QO&apos;SHILISH
      </a>
      <p className="cta-bounce flex items-center gap-1 text-[10px] font-medium text-[#edc55e] md:text-xs">
        <svg
          className="h-3 w-3 md:h-3.5 md:w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="m5 12 7-7 7 7" />
        </svg>
        Telegram kanalga qo&apos;shiling
      </p>
    </div>
  );
}
