// app/components/Dashboard/StatCard.tsx
"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'cyan' | 'indigo' | 'amber' | 'rose' | 'emerald';
  isCurrency?: boolean;
  delay?: number;
}

const colorConfig = {
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    iconBorder: 'border-cyan-500/30',
  },
  indigo: {
    bg: 'from-indigo-500/10 to-indigo-500/5',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    iconBg: 'bg-indigo-500/20',
    iconBorder: 'border-indigo-500/30',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    iconBorder: 'border-amber-500/30',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
    iconBorder: 'border-rose-500/30',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    iconBorder: 'border-emerald-500/30',
  },
};

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'cyan',
  isCurrency = false,
  delay = 0 
}: StatCardProps) {
  const colors = colorConfig[color];
  
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (isCurrency) {
      return `${val.toLocaleString()} DA`;
    }
    return val.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className={`group bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 transition-all duration-500 hover:border-${color}-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {title}
          </p>
          <h3 className={`text-2xl font-black ${colors.text} italic`}>
            {formatValue(value)}
          </h3>
        </div>
        
        <div className={`p-3 ${colors.iconBg} rounded-xl border ${colors.iconBorder} transition-transform group-hover:scale-110`}>
          <div className={colors.text}>
            {icon}
          </div>
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">
              {trend.label}
            </span>
            <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${
              trend.value >= 0
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {trend.value >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(trend.value)}%
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}