// app/components/analytics/KPICard.tsx
'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AnalyticsCard } from '@/app/types/analytics.types';
import { getIcon } from './IconMapper';

interface KPICardProps {
  card: AnalyticsCard;
}

const colorClasses = {
  emerald: 'bg-emerald-500/10 text-emerald-500',
  blue: 'bg-blue-500/10 text-blue-500',
  purple: 'bg-purple-500/10 text-purple-500',
  amber: 'bg-amber-500/10 text-amber-500'
};

export function KPICard({ card }: KPICardProps) {
  const Icon = getIcon(card.iconName);

  return (
    <Link
      href={card.href}
      className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 hover:border-indigo-500/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${colorClasses[card.color as keyof typeof colorClasses]} group-hover:scale-110 transition-transform`}>
          <Icon size={18} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${
          card.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
        }`}>
          {card.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {card.change}%
        </div>
      </div>
      <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">
        {card.title}
      </p>
      <p className="text-2xl font-black mt-1">{card.value}</p>
      <div className="flex items-center gap-1 mt-2 text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Voir détails</span>
        <ArrowRight size={12} />
      </div>
    </Link>
  );
}