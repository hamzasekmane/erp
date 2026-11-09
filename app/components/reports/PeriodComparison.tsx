"use client";

import { TrendingUp, TrendingDown, Calendar, DollarSign, CreditCard, ArrowRight } from "lucide-react";

interface PeriodData {
  total: number;
  count: number;
  avg: number;
}

interface PeriodComparisonProps {
  currentPeriod: PeriodData;
  previousPeriod: PeriodData;
  revenueGrowth: number;
  transactionGrowth: number;
  currentPeriodName?: string;
  previousPeriodName?: string;
}

export default function PeriodComparison({
  currentPeriod,
  previousPeriod,
  revenueGrowth,
  transactionGrowth,
  currentPeriodName = "Période actuelle",
  previousPeriodName = "Période précédente"
}: PeriodComparisonProps) {
  const isPositiveGrowth = revenueGrowth >= 0;

  return (
    <div className="bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[var(--accent)]/20 rounded-lg">
          <Calendar size={14} className="text-[var(--accent)]" />
        </div>
        <h3 className="font-black">Comparaison des périodes</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Period */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">
            {currentPeriodName}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                <DollarSign size={10} />
                <span>Total encaissé</span>
              </div>
              <p className="text-2xl font-black text-[var(--accent)]">
                {currentPeriod.total.toLocaleString()}€
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                <CreditCard size={10} />
                <span>Transactions</span>
              </div>
              <p className="text-2xl font-black">
                {currentPeriod.count}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                <TrendingUp size={10} />
                <span>Moyenne</span>
              </div>
              <p className="text-xl font-bold">
                {Math.round(currentPeriod.avg).toLocaleString()}€
              </p>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="relative flex items-center justify-center">
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-[var(--border)]" />
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] rounded-full border border-[var(--border)]">
            <ArrowRight size={14} className="text-[var(--accent)]" />
            <span className="text-[9px] font-black uppercase">VS</span>
            <ArrowRight size={14} className="text-[var(--accent)] rotate-180" />
          </div>
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-[var(--border)]" />
        </div>

        {/* Previous Period */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">
            {previousPeriodName}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                <DollarSign size={10} />
                <span>Total encaissé</span>
              </div>
              <p className="text-2xl font-black text-[var(--foreground-muted)]">
                {previousPeriod.total.toLocaleString()}€
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                <CreditCard size={10} />
                <span>Transactions</span>
              </div>
              <p className="text-2xl font-black text-[var(--foreground-muted)]">
                {previousPeriod.count}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[8px] text-[var(--foreground-muted)]">
                <TrendingUp size={10} />
                <span>Moyenne</span>
              </div>
              <p className="text-xl font-bold text-[var(--foreground-muted)]">
                {Math.round(previousPeriod.avg).toLocaleString()}€
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Indicators */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl">
            <div>
              <p className="text-[8px] text-[var(--foreground-muted)] uppercase">Évolution CA</p>
              <div className="flex items-center gap-1">
                {isPositiveGrowth ? (
                  <TrendingUp size={12} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={12} className="text-rose-500" />
                )}
                <span className={`text-sm font-black ${isPositiveGrowth ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-[var(--foreground-muted)] uppercase">Variation</p>
              <p className="text-sm font-bold">
                {Math.abs(currentPeriod.total - previousPeriod.total).toLocaleString()}€
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl">
            <div>
              <p className="text-[8px] text-[var(--foreground-muted)] uppercase">Évolution Transactions</p>
              <div className="flex items-center gap-1">
                {transactionGrowth >= 0 ? (
                  <TrendingUp size={12} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={12} className="text-rose-500" />
                )}
                <span className={`text-sm font-black ${transactionGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Math.abs(transactionGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-[var(--foreground-muted)] uppercase">Variation</p>
              <p className="text-sm font-bold">
                {Math.abs(currentPeriod.count - previousPeriod.count)} txns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}