import AnalyticsTracker from "./components/AnalyticsTracker";
import JoinButton from "./components/JoinButton";

function EventDateBadge() {
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d9a520]/40 bg-[#d9a520]/10 px-3 py-1.5 text-[11px] font-bold text-[#edc55e] md:text-sm">
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        18-IYUN
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d9a520]/40 bg-[#d9a520]/10 px-3 py-1.5 text-[11px] font-bold text-[#edc55e] md:text-sm">
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Soat: 20:00
      </div>
    </div>
  );
}

function HeroTitle() {
  return (
    <div className="flex flex-col items-center gap-3 text-center md:gap-5">
      <div className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#050505] md:px-4 md:text-[10px] md:tracking-[0.18em]">
        Jahon Bozori — online taqdimot
      </div>
      <h1 className="max-w-[16ch] text-[clamp(1.6rem,7.5vw,2.8rem)] font-black uppercase leading-[1.05] tracking-tight text-center">
        <span className="bg-[linear-gradient(135deg,#ffffff,#f5ead4)] bg-clip-text text-transparent">
          ONLINE TAQDIMOTDA QATNASHING
        </span>
        <br />
        <span className="bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] bg-clip-text text-transparent">
          VA SOV&apos;G&apos;ALAR YUTIB OLING!
        </span>
      </h1>
    </div>
  );
}

function HeroImage() {
  return (
    <div className="mx-auto w-full overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] md:max-w-md md:rounded-[2rem]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/prize.png"
        alt="Jahon Bozori yopiq aksiyasi"
        className="block h-auto w-full"
      />
    </div>
  );
}



function TrustInfo() {
  return (
    <footer className="-mx-4 shrink-0 border-t border-white/10 bg-[#050505]/92 px-4 py-1.5 text-center text-[9px] font-medium leading-snug text-[#8f8f8f] backdrop-blur-md sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 md:py-3 md:text-sm">
      &copy; 2026 Jahon Bozori. Designed and developed by{" "}
      <a
        href="https://www.zamon-agency.uz/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-orange-400 transition-colors hover:text-orange-300"
      >
        Zamon Agency
      </a>
      .
    </footer>
  );
}

export default function Home() {
  return (
    <main className="h-[100dvh] overflow-hidden bg-[#050505] text-[#f5f5f5]">
      <AnalyticsTracker />
      <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col px-4 sm:px-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 md:gap-7 md:py-8">
          <EventDateBadge />
          <HeroTitle />
          <HeroImage />
          <div className="mx-auto w-full max-w-xs rounded-2xl border border-[#d9a520]/30 bg-[#d9a520]/[0.08] px-4 py-3 text-center text-[12px] font-semibold leading-snug text-[#f0d7a2] md:max-w-sm md:text-sm">
            18-iyun kuni <span className="font-black text-[#edc55e]">soat 20:00 da</span> bo&apos;lib o&apos;tadigan Jahon Bozori taqdimotiga online qo&apos;shiling!
          </div>
          <JoinButton />
        </div>

        <TrustInfo />
      </div>
    </main>
  );
}
