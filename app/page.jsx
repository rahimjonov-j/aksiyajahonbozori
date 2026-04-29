import Image from "next/image";

const botUrl = "https://t.me/Jaxon_bozor_Bot?start=ref_1256520272";

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
        FARG&apos;ONADA BEPULGA BYD YUTIB OLING!
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
      <div className="relative mx-auto aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#0b0b0b] shadow-[0_24px_80px_rgba(0,0,0,0.42)] min-[390px]:rounded-[1.5rem] md:aspect-[21/9] md:rounded-[2.2rem] lg:aspect-[16/9] lg:max-w-none">
        <Image
          src="/optimized/newimg-hero.webp"
          alt="BYD Champion avtomobili"
          fill
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.12)_52%,rgba(5,5,5,0.76))]" />

        <div className="absolute left-2.5 top-2.5 rounded-xl border border-[#d9a520]/30 bg-black/45 px-2.5 py-1.5 backdrop-blur-sm md:left-6 md:top-6 md:rounded-2xl md:px-3 md:py-2">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#edc55e] md:text-xs md:tracking-[0.14em]">
            Bosh sovrin
          </p>
          <p className="text-[8px] font-semibold text-[#b8b8b8] md:text-xs">
            BYD avtomobili
          </p>
        </div>

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
          Faqat ro&apos;yxatdan o&apos;tganlar va ofisga kelganlar qatnashadi
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
      <a
        href={botUrl}
        className="w-full rounded-[1.35rem] bg-[linear-gradient(135deg,#34d058,#16a34a,#0f7a34)] px-5 py-4 text-center text-[13px] font-black uppercase tracking-[0.06em] text-white shadow-[0_18px_44px_rgba(22,163,74,0.38)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 animate-pulse min-[380px]:text-sm md:max-w-sm md:py-5 md:text-lg md:tracking-[0.08em]"
      >
        AKSIYADA QATNASHISH
      </a>
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
