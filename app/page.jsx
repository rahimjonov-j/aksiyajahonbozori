import AnalyticsTracker from "./components/AnalyticsTracker";
import TelegramCta from "./components/TelegramCta";

const botUsername = "Jaxon_bozor_Bot";
const botStartPrefix = "ref_1256520272";

const countdown = [
  { value: "03", label: "kun" },
  { value: "18", label: "soat" },
  { value: "45", label: "daq." },
];

function Header() {
  return (
    <header className="flex shrink-0 justify-center lg:justify-start">
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#d9a520]/30 bg-white/[0.04] py-1.5 pl-1.5 pr-3 shadow-[0_14px_45px_rgba(0,0,0,0.32)] backdrop-blur-md md:gap-2.5 md:pr-4">
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white md:h-8 md:w-8">
          <picture>
            <source
              srcSet="/optimized/logo-dark.webp"
              media="(prefers-color-scheme: dark)"
            />
            <img
              src="/optimized/logo-light.webp"
              alt="Jahon Bozori"
              className="h-full w-full object-contain p-1"
            />
          </picture>
        </div>
        <span className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-[#d9a520] min-[380px]:text-[10px] md:text-sm md:tracking-[0.12em]">
          YevroOsiyo - xalqaro savdo markazi
        </span>
      </div>
    </header>
  );
}

function HeroText() {
  return (
    <section className="order-1 mx-auto flex w-full max-w-4xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
      <div className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#050505] md:px-4 md:text-[10px] md:tracking-[0.18em]">
        Jahon Bozor konkursi
      </div>
      <h1 className="mx-auto mt-3 max-w-[13ch] bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] bg-clip-text text-center text-[clamp(1.9rem,8.7vw,3.15rem)] font-black uppercase leading-[1.02] tracking-normal text-transparent md:mt-5 md:max-w-[13ch] md:text-[clamp(3.2rem,5vw,5rem)] lg:mx-0 lg:text-left">
        FARG&apos;ONADA TEKINGA DO&apos;KON YUTIB OLING!
      </h1>
      <p className="mt-3 text-[13px] font-medium text-[#b8b8b8] md:mt-5 md:text-lg">
        Jahon Bozorining yopiq aksiyasi boshlandi
      </p>
    </section>
  );
}

function HeroVisual() {
  return (
    <section className="w-full min-h-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
      <div className="mx-auto w-[72%] md:w-full max-w-5xl overflow-hidden rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] md:rounded-[2.2rem] lg:max-w-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/newimg.png"
          alt="BYD Champion avtomobili"
          className="block w-full h-auto"
        />
      </div>
    </section>
  );
}

function TriggerAndTimer() {
  return (
    <section className="order-4 grid w-full grid-cols-[1fr_auto] items-center gap-2.5 rounded-2xl border border-[#d9a520]/20 bg-[#d9a520]/[0.07] p-3 shadow-[0_12px_34px_rgba(0,0,0,0.2)] md:p-4">
      <div className="flex min-w-0 items-start gap-1.5 min-[380px]:gap-2.5">
        <span className="mt-0.5 shrink-0 text-xs min-[380px]:text-sm">
          ⚠️
        </span>
        <p className="min-w-0 text-[9px] font-semibold leading-snug text-[#f0d7a2] min-[380px]:text-[10px] md:text-sm">
          Faqat ro&apos;yxatdan o&apos;tganlar va do&apos;kon harid qilganlar qatnashadi
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {countdown.map((item) => (
          <div
            key={item.label}
            className="min-w-8 rounded-xl border border-white/10 bg-black/35 px-1 py-1 text-center min-[380px]:min-w-9 md:min-w-10 md:px-1.5"
          >
            <div className="text-[11px] font-black leading-none text-[#edc55e] md:text-base">
              {item.value}
            </div>
            <div className="mt-0.5 text-[7px] font-bold uppercase text-[#8f8f8f] min-[380px]:text-[8px] md:text-[10px]">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="order-5 flex w-full flex-col items-center gap-2">
      <TelegramCta botUsername={botUsername} startPrefix={botStartPrefix} />
      <p className="text-[10px] font-medium text-[#8f8f8f] md:text-xs">
        Telegram orqali ro&apos;yxatdan o&apos;ting
      </p>
    </section>
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
    <main className="min-h-[100dvh] bg-[#050505] text-[#f5f5f5]">
      <AnalyticsTracker />
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-4 pt-2 sm:px-6 md:px-8 md:pt-5">
        <Header />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 py-2 min-[390px]:gap-5 md:gap-7 md:py-6 lg:grid lg:grid-cols-[0.68fr_1.32fr] lg:grid-rows-[auto_auto] lg:content-center lg:items-center lg:gap-x-8 lg:gap-y-5">
          <section className="flex w-full max-w-4xl flex-col items-center lg:col-start-1 lg:row-start-1 lg:max-w-none lg:items-start">
            <HeroText />
          </section>

          <HeroVisual />

          <section className="flex w-full max-w-xl flex-col gap-4 md:gap-5 lg:col-start-1 lg:row-start-2 lg:max-w-none">
            <TriggerAndTimer />
            <Cta />
          </section>
        </div>

        <TrustInfo />
      </div>
    </main>
  );
}
