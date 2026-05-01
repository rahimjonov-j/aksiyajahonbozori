import { getAnalyticsSnapshot } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDateTime(value) {
  if (!value) {
    return "Hali yo'q";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDayLabel(value) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function getDailyAverage(days) {
  if (!days.length) {
    return 0;
  }

  const total = days.reduce((sum, day) => sum + day.visits, 0);
  return Math.round(total / days.length);
}

function getPeakDay(days) {
  if (!days.length) {
    return null;
  }

  return days.reduce((best, day) => (day.visits > best.visits ? day : best));
}

function getTrendText(todayValue, yesterdayValue, noun) {
  const diff = todayValue - yesterdayValue;

  if (diff > 0) {
    return `Kechagidan ${diff} ta ko'p ${noun}`;
  }

  if (diff < 0) {
    return `Kechagidan ${Math.abs(diff)} ta kam ${noun}`;
  }

  return `Kechagi bilan bir xil ${noun}`;
}

function getDropOff(clicks, confirmed) {
  return Math.max(clicks - confirmed, 0);
}

function SummaryCard({ label, value, helper, tone = "gold" }) {
  const toneClass =
    tone === "green"
      ? "from-[#34d058]/20 to-transparent text-[#7ef0a0]"
      : tone === "blue"
        ? "from-[#3b82f6]/20 to-transparent text-[#8fc2ff]"
        : "from-[#d9a520]/20 to-transparent text-[#f4cf76]";

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneClass}`} />
      <div className="relative">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8a8a8]">
          {label}
        </p>
        <p className="mt-4 text-4xl font-black tracking-tight text-white">
          {value}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#b8b8b8]">{helper}</p>
      </div>
    </div>
  );
}

function InsightCard({ title, value, helper, compact = false }) {
  return (
    <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9a520]">
        {title}
      </p>
      <p className="mt-3 whitespace-nowrap text-3xl font-black leading-none text-white sm:text-[2rem]">
        {value}
      </p>
      {!compact ? <p className="mt-2 text-sm text-[#9f9f9f]">{helper}</p> : null}
    </div>
  );
}

function PlatformBreakdownCard({ title, subtitle, items }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9a520]">
        {title}
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">{subtitle}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-[1.25rem] border border-white/8 bg-black/20 px-4 py-3"
          >
            <div>
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="mt-1 text-xs text-[#8f8f8f]">
                {item.uniqueVisitors} ta unikal user
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-[#edc55e]">{item.visits}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8f8f8f]">
                tashrif
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyBarChart({ days }) {
  const maxVisits = Math.max(...days.map((day) => day.visits), 1);
  const maxTelegram = Math.max(
    ...days.map((day) => day.uniqueTelegramOpenVisitors),
    1,
  );

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const visitWidth = `${Math.max((day.visits / maxVisits) * 100, day.visits ? 8 : 0)}%`;
        const telegramWidth = `${Math.max(
          (day.uniqueTelegramOpenVisitors / maxTelegram) * 100,
          day.uniqueTelegramOpenVisitors ? 8 : 0,
        )}%`;

        return (
          <div
            key={day.day}
            className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">
                  {formatDayLabel(day.day)}
                </p>
                <p className="mt-1 text-xs text-[#8f8f8f]">{day.day}</p>
              </div>
              <div className="text-right text-xs text-[#9f9f9f]">
                <p>{day.visits} tashrif</p>
                <p>{day.uniqueTelegramOpenVisitors} ta Telegram ochilgan</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-[0.14em] text-[#d9a520]">
                    Sayt
                  </span>
                  <span className="text-[#d7d7d7]">{day.visits}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#edc55e,#d9a520,#cf8217)]"
                    style={{ width: visitWidth }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-[0.14em] text-[#59db79]">
                    Telegram ochildi
                  </span>
                  <span className="text-[#d7d7d7]">
                    {day.uniqueTelegramOpenVisitors}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#34d058,#16a34a,#0f7a34)]"
                    style={{ width: telegramWidth }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsSnapshot();
  const { summary, last7Days, platformBreakdown } = analytics;
  const today = last7Days.at(-1) ?? {
    day: "",
    visits: 0,
    uniqueVisitors: 0,
    telegramClicks: 0,
    uniqueTelegramClickers: 0,
    telegramOpenSignals: 0,
    uniqueTelegramOpenVisitors: 0,
    telegramConfirmedStarts: 0,
    uniqueTelegramConfirmedVisitors: 0,
    sourceBreakdown: {
      telegram: { visits: 0, uniqueVisitors: 0 },
      instagram: { visits: 0, uniqueVisitors: 0 },
      facebook: { visits: 0, uniqueVisitors: 0 },
      direct: { visits: 0, uniqueVisitors: 0 },
      other: { visits: 0, uniqueVisitors: 0 },
    },
  };
  const yesterday = last7Days.at(-2) ?? today;
  const averageDailyVisits = getDailyAverage(last7Days);
  const peakDay = getPeakDay(last7Days);
  const totalTelegramOpenMiss = getDropOff(
    summary.uniqueTelegramClickers,
    summary.uniqueTelegramOpenVisitors,
  );
  const todayTelegramOpenMiss = getDropOff(
    today.uniqueTelegramClickers,
    today.uniqueTelegramOpenVisitors,
  );
  const todayPlatformBreakdown = platformBreakdown.map((platform) => ({
    key: platform.key,
    label: platform.label,
    visits: today.sourceBreakdown?.[platform.key]?.visits ?? 0,
    uniqueVisitors: today.sourceBreakdown?.[platform.key]?.uniqueVisitors ?? 0,
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(217,165,32,0.14),transparent_30%),#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-[#d9a520]/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(217,165,32,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#d9a520]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#16a34a]/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#d9a520]">
              ANALIZ PANELI
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
              Saytga kirganlar va Telegramga o'tganlar
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#c7c7c7] sm:text-base">
              Bu yerda jami tashriflar, botga o'tgan odamlar va kunlik oqim
              bitta joyda ko'rinadi. Eng muhim raqamlar tepada, kunlik harakat
              esa pastdagi bloklarda aniq ko'rsatiladi.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <SummaryCard
            label="Jami saytga kirganlar"
            value={summary.totalVisits}
            helper={`Oxirgi tashrif: ${formatDateTime(summary.lastVisitAt)}`}
          />
          <SummaryCard
            label="Telegram tugma bosganlar"
            value={summary.uniqueTelegramClickers}
            helper={`${summary.totalTelegramClicks} ta umumiy bosish qayd etildi`}
            tone="green"
          />
          <SummaryCard
            label="Bugungi tashrif"
            value={today.visits}
            helper={getTrendText(today.visits, yesterday.visits, "tashrif")}
            tone="blue"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9a520]">
                  Qisqa xulosa
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Bir qarashda holat
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InsightCard
                title="1 kunda o'rtacha"
                value={`${averageDailyVisits} ta`}
                helper="Oxirgi 7 kun bo'yicha o'rtacha tashrif"
              />
              <InsightCard
                title="Bugun unikal"
                value={`${today.uniqueVisitors} ta`}
                helper="Bugun kamida bir marta kirgan alohida userlar"
              />
              <InsightCard
                title="Bugun tugma bosgan"
                value={`${today.uniqueTelegramClickers} ta`}
                helper="Bugun saytdagi Telegram tugmasini bosgan userlar"
              />
              <InsightCard
                title="Bugun Telegram ochildi"
                value={`${today.uniqueTelegramOpenVisitors} ta`}
                helper="Tugmadan keyin app/browser almashgan userlar"
              />
              <InsightCard
                title="Eng faol kun"
                value={peakDay ? formatDayLabel(peakDay.day) : "-"}
                helper={
                  peakDay
                    ? `${peakDay.visits} ta tashrif bilan eng yuqori kun`
                    : "Hozircha ma'lumot yo'q"
                }
              />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[#16a34a]/20 bg-[#16a34a]/[0.06] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7ef0a0]">
                Bugungi holat
              </p>
              <p className="mt-2 text-sm leading-7 text-[#d7d7d7]">
                Bugun saytga <span className="font-black text-white">{today.visits}</span>{" "}
                ta tashrif bo'ldi. Shundan{" "}
                <span className="font-black text-white">
                  {today.uniqueTelegramOpenVisitors}
                </span>{" "}
                tasi Telegram ochilganga o'xshadi.{" "}
                <span className="font-black text-white">
                  {todayTelegramOpenMiss}
                </span>{" "}
                tasi esa tugmani bosgan bo'lsa ham Telegram ochilgani kuzatilmadi.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9a520]">
              Kunlik oqim
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Oxirgi 7 kun dinamikasi
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#a8a8a8]">
              Har bir kunda nechta odam kirgani va nechta odamda Telegram
              ochilganga o'xshagan signal bo'lgani shu yerda ko'rinadi.
            </p>

            <div className="mt-5">
              <DailyBarChart days={last7Days} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9a520]">
            Telegram funnel
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Tugma bosgan va Telegram ochilganlar
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <InsightCard
              title="Tugma bosgan"
              value={`${summary.uniqueTelegramClickers} ta`}
              helper="Saytdan Telegram tugmasini bosgan userlar"
              compact
            />
            <InsightCard
              title="Telegram ochilgan"
              value={`${summary.uniqueTelegramOpenVisitors} ta`}
              helper="Tugmadan keyin app/browser almashgan ehtimoliy signal"
              compact
            />
            <InsightCard
              title="Ochilmagan"
              value={`${totalTelegramOpenMiss} ta`}
              helper="Tugma bosilgan, lekin Telegram ochilgani kuzatilmagan userlar"
              compact
            />
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <PlatformBreakdownCard
            title="Jami platformalar"
            subtitle="Qaysi kanal qancha odam olib keldi"
            items={platformBreakdown}
          />
          <PlatformBreakdownCard
            title="Bugungi platformalar"
            subtitle="Bugun qaysi platformadan qancha kirish bo'ldi"
            items={todayPlatformBreakdown}
          />
        </section>
      </div>
    </main>
  );
}
