import Image from "next/image";

const botUrl = "https://t.me/Jaxon_bozor_Bot?start=ref_1256520272";

const prizeCards = [
  {
    points: "Top 5",
    title: "Smartfon + 30 mln so'm vaucher",
    note: "Eng ko'p ball to'plagan 5 ishtirokchi",
    image: "/optimized/smartfon30mlnvaucher-card.webp",
  },
  {
    points: "400+ ball",
    title: "Kir yuvish mashinasi",
    note: "Tasodifiy 2 kishiga",
    image: "/optimized/kiryuvuchi-card.webp",
  },
  {
    points: "200+ ball",
    title: "Televizor + blender",
    note: "Tasodifiy 3 kishiga",
    image: "/optimized/televizorvablender-card.webp",
  },
  {
    points: "100+ ball",
    title: "15 mln so'm vaucher + sok chiqaruvchi",
    note: "Vaucher 5 kishiga, sok chiqaruvchi 3 kishiga",
    image: "/optimized/15mlnsokaparat-card.webp",
  },
  {
    points: "20+ ball",
    title: "5 mln so'm vaucher + sok chiqaruvchi",
    note: "Vaucher 5 kishiga, sok chiqaruvchi 3 kishiga",
    image: "/optimized/5mlnvauchersokchiqaruvchi-card.webp",
  },
];

const countdown = [
  { value: "03", label: "kun" },
  { value: "18", label: "soat" },
  { value: "45", label: "daq." },
];

function Header() {
  return (
    <header className="flex justify-center pt-3 md:pt-0">
      <div className="inline-flex items-center gap-2.5 rounded-full border border-[#d9a520]/30 bg-white/[0.04] py-1.5 pl-1.5 pr-4 shadow-[0_14px_45px_rgba(0,0,0,0.32)] backdrop-blur-md">
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white">
          <Image
            src="/logo.png"
            alt="Jahon Bozori"
            fill
            priority
            sizes="32px"
            className="object-contain p-1"
          />
        </div>
        <span className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.12em] text-[#d9a520] md:text-sm">
          YevroOsiyo - halqaro savdo markazi
        </span>
      </div>
    </header>
  );
}

function HeroText() {
  return (
    <section className="order-1 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
      <div className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#050505]">
        Jahon Bozor konkursi
      </div>
      <h1 className="mx-auto mt-4 max-w-[13ch] bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] bg-clip-text text-center text-[clamp(2.15rem,9.5vw,3.35rem)] font-black uppercase leading-[1.02] tracking-tight text-transparent md:mt-5 md:max-w-[13ch] md:text-[clamp(3.8rem,5.8vw,5.7rem)]">
        FARG&apos;ONADA BEPULGA BYD YUTIB OLING!
      </h1>
      <p className="mt-4 text-[14px] font-medium text-[#b8b8b8] md:mt-5 md:text-lg">
        Jahon Bozorining yopiq aksiyasi boshlandi
      </p>
    </section>
  );
}

function HeroVisual() {
  return (
    <section className="w-full">
      <div className="relative mx-auto aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0b0b0b] shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:aspect-[21/9] md:rounded-[2.2rem]">
        <Image
          src="/optimized/byd-hero.webp"
          alt="BYD Champion avtomobili"
          fill
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.12)_52%,rgba(5,5,5,0.76))]" />

        <div className="absolute left-3 top-3 rounded-2xl border border-[#d9a520]/30 bg-black/45 px-3 py-2 backdrop-blur-sm md:left-6 md:top-6">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#edc55e] md:text-xs">
            Bosh sovg&apos;a
          </p>
          <p className="text-[9px] font-semibold text-[#b8b8b8] md:text-xs">
            BYD Champion
          </p>
        </div>

        <div className="absolute right-3 top-3 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2 backdrop-blur-sm md:right-6 md:top-6">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white md:text-xs">
            Bantik
          </p>
          <p className="text-[9px] font-semibold text-[#d9a520] md:text-xs">
            sovg&apos;a holida
          </p>
        </div>

        <div className="absolute bottom-3 left-3 max-w-[62%] rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-sm md:bottom-6 md:left-6 md:text-sm">
          BYD Champion avtomobili
        </div>
        <div className="absolute bottom-3 right-3 rounded-2xl bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] px-3 py-2 text-[10px] font-black text-[#050505] md:bottom-6 md:right-6 md:text-sm">
          Asosiy sovg&apos;a
        </div>
      </div>
    </section>
  );
}

function PrizeGrid() {
  return (
    <section className="mt-10 md:mt-12">
      <div className="mb-4 text-center md:mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a520]">
          Ball to&apos;plang va yuting
        </p>
        <h2 className="mt-2 text-2xl font-black text-white md:text-4xl">
          Sovg&apos;alar jadvali
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {prizeCards.map((prize) => (
          <article
            key={`${prize.points}-${prize.title}`}
            className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101010] shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-md transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex h-full flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#111111] lg:aspect-[5/4]">
                <Image
                  src={prize.image}
                  alt={prize.title}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.08)_48%,rgba(5,5,5,0.72))]" />
                <div className="absolute left-3 top-3 rounded-full bg-[linear-gradient(135deg,#edc55e,#d9a520,#cf8217)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#050505]">
                  {prize.points}
                </div>
              </div>
              <div className="flex flex-1 flex-col border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4">
                <h3 className="text-[15px] font-black leading-snug text-white md:text-base">
                  {prize.title}
                </h3>
                <p className="mt-2 text-[12px] font-semibold leading-snug text-[#a9a9a9]">
                  {prize.note}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TriggerAndTimer() {
  return (
    <section className="order-4 mt-1 grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[#d9a520]/20 bg-[#d9a520]/[0.07] p-3 shadow-[0_12px_34px_rgba(0,0,0,0.2)] md:mt-5 md:p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-sm">⚠️</span>
        <p className="text-[11px] font-semibold leading-snug text-[#f0d7a2] md:text-sm">
          Faqat ro&apos;yxatdan o&apos;tganlar va ofisga kelganlar qatnashadi
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        {countdown.map((item) => (
          <div
            key={item.label}
            className="min-w-10 rounded-xl border border-white/10 bg-black/35 px-1.5 py-1 text-center"
          >
            <div className="text-[12px] font-black leading-none text-[#edc55e] md:text-base">
              {item.value}
            </div>
            <div className="mt-0.5 text-[8px] font-bold uppercase text-[#8f8f8f] md:text-[10px]">
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
    <section className="order-5 flex w-full flex-col items-center gap-2 md:mt-6">
      <a
        href={botUrl}
        className="w-full rounded-[1.45rem] bg-[linear-gradient(135deg,#34d058,#16a34a,#0f7a34)] px-6 py-5 text-center text-[15px] font-black uppercase tracking-[0.08em] text-white shadow-[0_18px_44px_rgba(22,163,74,0.38)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 animate-pulse md:max-w-sm md:py-5 md:text-lg"
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
    <footer className="sticky bottom-0 z-40 -mx-4 mt-10 border-t border-white/10 bg-[#050505]/92 px-4 py-3 text-center text-[11px] font-medium text-[#8f8f8f] backdrop-blur-md sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 md:text-sm">
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
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#050505] pb-3 text-[#f5f5f5] md:pb-0">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1180px] flex-col px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <Header />

        <div className="flex flex-col items-center gap-7 pb-7 pt-[43px] md:gap-9 md:pb-12 md:pt-[63px]">
          <section className="flex w-full max-w-4xl flex-col items-center">
            <HeroText />
          </section>

          <HeroVisual />

          <section className="flex w-full max-w-xl flex-col gap-5">
            <TriggerAndTimer />
            <Cta />
          </section>
        </div>

        <PrizeGrid />

        <TrustInfo />
      </div>
    </main>
  );
}
