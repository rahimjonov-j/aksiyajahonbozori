"use client";

import { useState, useEffect } from "react";

// June 18, 2026 at 20:00 Tashkent time (UTC+5)
const TARGET = new Date("2026-06-18T20:00:00+05:00");

function getTimeLeft() {
  const diff = Math.max(0, TARGET.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function Pad({ value }) {
  return String(value).padStart(2, "0");
}

export default function Countdown() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { value: time?.days ?? 0, label: "KUN" },
    { value: time?.hours ?? 0, label: "SOAT" },
    { value: time?.minutes ?? 0, label: "DAQ" },
    { value: time?.seconds ?? 0, label: "SEK" },
  ];

  return (
    <div className="flex shrink-0 gap-1.5">
      {units.map((u) => (
        <div
          key={u.label}
          className="min-w-[2.4rem] rounded-xl border border-white/10 bg-black/40 px-1.5 py-1.5 text-center md:min-w-11"
        >
          <div className="text-[13px] font-black leading-none tabular-nums text-[#edc55e] md:text-base">
            <Pad value={u.value} />
          </div>
          <div className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-[#8f8f8f] md:text-[9px]">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}
