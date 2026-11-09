"use client";

import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'purple';
}

export default function StatCard({ 
  label, 
  value, 
  subLabel, 
  icon, 
  trend, 
  trendUp = true, 
  color = 'blue' 
}: StatCardProps) {
  
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600'
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-full italic
            ${trendUp 
              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' 
              : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'
            }`}
          >
            <ArrowUpRight size={10} className={trendUp ? '' : 'rotate-90'} /> 
            {trend}
          </div>
        )}
      </div>
      <p className="text-[12px] font-black uppercase text-[var(--foreground-muted)] tracking-wider italic">{label}</p>
      <h2 className="text-2xl font-black italic mt-1 text-[var(--foreground)]">{value}</h2>
      <p className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase mt-2 tracking-tight opacity-60">{subLabel}</p>
    </div>
  );
}