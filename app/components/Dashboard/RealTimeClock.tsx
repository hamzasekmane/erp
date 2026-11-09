"use client";

import { useState, useEffect } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";

interface RealTimeClockProps {
  lastUpdated: string; // initial value from server
}

export default function RealTimeClock({ lastUpdated: initialLastUpdated }: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(initialLastUpdated);

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const formattedTime = currentTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-lg">
      <div className="flex items-center gap-2">
        <div className="p-1 bg-[var(--accent)]/10 rounded-md">
          <CalendarClock size={12} className="text-[var(--accent)]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">
            Date & Heure
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-[var(--foreground)]">{formattedDate}</span>
            <div className="w-0.5 h-0.5 rounded-full bg-[var(--border)]" />
            <span className="text-[10px] font-black text-[var(--accent)] tabular-nums">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>
      <div className="w-px h-5 bg-[var(--border)]" />
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1">
          <RefreshCw size={9} className="text-[var(--accent)] animate-spin-slow" />
          <span className="text-[10px] font-bold tabular-nums text-[var(--foreground)]">
            {lastUpdated}
          </span>
        </div>
        <span className="text-[8px] font-black text-[var(--foreground-muted)] uppercase">Sync</span>
      </div>
    </div>
  );
}