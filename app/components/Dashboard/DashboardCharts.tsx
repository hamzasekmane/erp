"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface ChartData {
  name: string;
  sales: number;
  [key: string]: any;
}

interface DashboardChartsProps {
  data: ChartData[];
  title?: string;
  height?: number;
  showComparison?: boolean;
}

export default function DashboardCharts({ 
  data, 
  title = "Performance",
  height = 200,
  showComparison = true 
}: DashboardChartsProps) {
  const [isClient, setIsClient] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setIsClient(true), []);

  // Skeleton loading (compact)
  if (!isClient) {
    return (
      <div className="bg-[var(--card-bg)]/50 backdrop-blur-sm border border-[var(--border)] rounded-xl p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[var(--accent)]/20 rounded"></div>
            <div className="h-3 w-32 bg-[var(--card-bg)] rounded-full animate-pulse"></div>
          </div>
          {showComparison && <div className="h-4 w-16 bg-[var(--card-bg)] rounded-full animate-pulse"></div>}
        </div>
        <div className="w-full bg-[var(--card-bg)] rounded-xl animate-pulse" style={{ height: height - 40 }} />
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--card-bg)]/50 backdrop-blur-sm border border-[var(--border)] rounded-xl p-4">
        <div className="flex flex-col items-center justify-center" style={{ height: height - 30 }}>
          <div className="p-2 bg-[var(--card-bg)] rounded-full mb-2">
            <BarChart3 size={20} className="text-[var(--foreground-muted)]" />
          </div>
          <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)]">Aucune donnée</p>
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)";
  const tooltipBg = "var(--background)";
  const tooltipBorder = "var(--border)";
  const axisColor = "var(--foreground-muted)";
  const tickColor = "var(--foreground-muted)";
  const tooltipTextColor = "var(--foreground)";
  const tooltipLabelColor = "var(--foreground-muted)";
  const accentColor = "var(--accent)";  // Keep as CSS variable

  // Simple total
  const currentMonthTotal = data.reduce((sum, item) => sum + (item.sales || 0), 0);
  const previousMonthTotal = currentMonthTotal * 0.85;
  const percentChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal * 100).toFixed(1);

  return (
    <div className="bg-[var(--card-bg)]/50 backdrop-blur-sm border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Compact header */}
      <div className="px-3 pt-2 pb-1 flex justify-between items-center border-b border-[var(--border)]/50">
        <h3 className="font-black uppercase text-[8px] tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
          <TrendingUp size={10} className="text-[var(--accent)]" />
          {title}
        </h3>
        {showComparison && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-[var(--foreground-muted)] bg-[var(--card-bg)] px-1.5 py-0.5 rounded-full border border-[var(--border)]">
              vs mois dernier
            </span>
            <span className={`text-[12px] font-black px-1.5 py-0.5 rounded-full ${
              Number(percentChange) >= 0 
                ? 'bg-green-100/20 text-green-600 border border-green-600/30'
                : 'bg-rose-500/20 text-rose-700 border border-rose-500/30'
            }`}>
              {percentChange}%
            </span>
          </div>
        )}
      </div>

      {/* Chart container with exact height */}
      <div style={{ height: `${height - 40}px`, minHeight: '120px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorSalesCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={gridColor} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 8, fill: tickColor, fontWeight: 700 }} 
              tickLine={false} 
              axisLine={false} 
              dy={5}
            />
            <YAxis 
              tick={{ fontSize: 8, fill: tickColor, fontWeight: 700 }} 
              tickLine={false} 
              axisLine={false} 
              width={35}
              tickFormatter={(v) => `${v/1000}k`}
            />
            <Tooltip
              cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '2 2' }}
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                fontSize: '10px',
                padding: '6px 10px',
                backdropFilter: 'blur(4px)'
              }}
              itemStyle={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '10px' }}
              labelStyle={{ fontSize: '8px', marginBottom: '2px' }}
              formatter={(value: any) => [`${Number(value).toLocaleString()} DA`, "Ventes"]}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#colorSalesCompact)"
              animationDuration={1500}
              activeDot={{ r: 3, stroke: '#06b6d4', strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer summary - minimal */}
      <div className="px-3 pb-2 pt-1 border-t border-[var(--border)]/50 flex justify-between text-[7px] font-black uppercase text-[var(--foreground-muted)]">
        <span>Total</span>
        <span className="text-[var(--accent)] text-[8px]">{currentMonthTotal.toLocaleString()} DA</span>
      </div>
    </div>
  );
}