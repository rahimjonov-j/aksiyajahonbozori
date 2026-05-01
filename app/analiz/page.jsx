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

function InsightCard({ title, value, helper }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9a520]">
        {title}
      </p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-[#9f9f9f]">{helper}</p>
    </div>
  );
}

function DailyBarChart({ days }) {
  const maxVisits = Math.max(...days.map((day) => day.visits), 1);
  const maxTelegram = Math.max(...days.map((day) => day.uniqueTelegramClickers), 1);

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const visitWidth = `${Math.max((day.visits / maxVisits) * 100, day.visits ? 8 : 0)}%`;
        const telegramWidth = `${Math.max(
          (day.uniqueTelegramClickers / maxTelegram) * 100,
          day.uniqueTelegramClickers ? 8 : 0,
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
                <p>{day.uniqueTelegramClickers} ta botga o'tgan</p>
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
                    Telegram
                  </span>
                  <span className="text-[#d7d7d7]">{day.uniqueTelegramClickers}</span>
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
  const { summary, last7Days, topReferrers, recentEvents } = analytics;
  const today = last7Days.at(-1) ?? {
    day: "",
    visits: 0,
    uniqueVisitors: 0,
    telegramClicks: 0,
    uniqueTelegramClickers: 0,
  };
  const yesterday = last7Days.at(-2) ?? today;
  const averageDailyVisits = getDailyAverage(last7Days);
  const peakDay = getPeakDay(last7Days);

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
            label="Telegram botga o'tganlar"
            value={summary.uniqueTelegramClickers}
            helper={`${summary.totalTelegramClicks} ta umumiy bosish, ${summary.conversionRate}% konversiya`}
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
                title="Bugun TG o'tgan"
                value={`${today.uniqueTelegramClickers} ta`}
                helper="Bugun Telegram botga o'tgan alohida userlar"
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
                  {today.uniqueTelegramClickers}
                </span>{" "}
                tasi Telegram botga o'tgan.
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
              Har bir kunda nechta odam kirgani va nechta odam Telegram botga
              o'tgani shu yerda ko'rinadi.
            </p>

            <div className="mt-5">
              <DailyBarChart days={last7Days} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9a520]">
              Trafik manbasi
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Qayerdan kelishyapti
            </h2>
            <div className="mt-5 space-y-3">
              {topReferrers.length > 0 ? (
                topReferrers.map((entry) => (
                  <div
                    key={entry.referrer}
                    className="flex items-center justify-between rounded-[1.25rem] border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <span className="max-w-[75%] truncate text-sm text-[#d7d7d7]">
                      {entry.referrer}
                    </span>
                    <span className="text-sm font-black text-[#edc55e]">
                      {entry.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8f8f8f]">Hozircha ma'lumot yo'q.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9a520]">
              So'nggi harakatlar
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Yaqin activity
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {recentEvents.length > 0 ? (
                recentEvents.slice(0, 6).map((event, index) => (
                  <div
                    key={`${event.visitorId}-${event.happenedAt}-${index}`}
                    className="rounded-[1.25rem] border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#edc55e]">
                        {event.type === "visit" ? "Saytga kirdi" : "Botga o'tdi"}
                      </span>
                      <span className="text-[11px] text-[#8f8f8f]">
                        {formatDateTime(event.happenedAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#d7d7d7]">
                      Sahifa: {event.pathname}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#8f8f8f]">
                      Manba: {event.referrer}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8f8f8f]">Hali activity yo'q.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
