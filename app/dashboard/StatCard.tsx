// frontend/app/dashboard/StatCard.tsx
import React from 'react';
import { formatDA } from "@/app/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  // Updated keys to match your new custom OKLCH colors
  color: "lime" | "mint" | "gold" | "royal" | "cyan" | "rose";
  trendValue?: string | number;
  isCurrency?: boolean;
  delay?: number;
}

// Fixed color mapping using your specific OKLCH values
const colorVariants = {
  // oklch(76.8% 0.233 130.85) - High Vibrancy Lime/Green
  lime: "bg-[oklch(76.8%_0.233_130.85)] shadow-[oklch(76.8%_0.233_130.85)/0.3] text-black",
  
  // oklch(85.5% 0.138 181.071) - Soft Mint/Aqua
  mint: "bg-[oklch(85.5%_0.138_181.071)] shadow-[oklch(85.5%_0.138_181.071)/0.3] text-black",
  
  // oklch(89.7% 0.196 126.665) - Bright Gold/Yellow
  gold: "bg-[oklch(89.7%_0.196_126.665)] shadow-[oklch(89.7%_0.196_126.665)/0.3] text-black",
  
  // oklch(42.4% 0.199 265.638) - Deep Royal Blue
  royal: "bg-[oklch(42.4%_0.199_265.638)] shadow-[oklch(42.4%_0.199_265.638)/0.3] text-white",
  
  // Keep existing fallbacks
  cyan: "bg-cyan-500 shadow-cyan-500/20 text-white",
  rose: "bg-rose-500 shadow-rose-500/20 text-white",
};

const dotColors = {
  lime: "bg-[oklch(76.8%_0.233_130.85)]",
  mint: "bg-[oklch(85.5%_0.138_181.071)]",
  gold: "bg-[oklch(89.7%_0.196_126.665)]",
  royal: "bg-[oklch(42.4%_0.199_265.638)]",
  cyan: "bg-cyan-500",
  rose: "bg-rose-500",
};

export default function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  trendValue, 
  isCurrency,
  delay = 0
}: StatCardProps) {
  const variantClass = colorVariants[color] || colorVariants.royal;
  const dotClass = dotColors[color] || dotColors.royal;
  const safeValue = isCurrency ? formatDA(value) : (value ?? 0);

  return (
    <div 
      className="relative group overflow-hidden bg-[var(--card-bg)]/60 backdrop-blur-xl p-6 rounded-[2rem] border border-[var(--border)] transition-all duration-500 hover:border-[var(--accent)]/40 hover:shadow-2xl hover:shadow-[var(--accent)]/10 animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Dynamic Glow using your OKLCH color */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity blur-3xl ${dotClass}`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-5 w-full">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.2em] opacity-70">
              {title}
            </p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-black text-[var(--foreground)] italic tracking-tighter tabular-nums leading-none">
                {safeValue}
              </h3>
              {isCurrency && (
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] opacity-80">
                  dzd
                </span>
              )}
            </div>
          </div>

          {trendValue !== undefined && (
            <div className="flex items-center gap-2 bg-[var(--background-secondary)] w-fit px-3 py-1.5 rounded-xl border border-[var(--border)] shadow-sm">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`}></span>
              </span>
              <span className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-tight truncate max-w-[140px]">
                {trendValue}
              </span>
            </div>
          )}
        </div>

        {/* Icon Container with new colors */}
        <div className={`p-4 rounded-2xl shadow-lg shrink-0 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${variantClass}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 22, strokeWidth: 2.5 } as any)}
        </div>
      </div>
    </div>
  );
}