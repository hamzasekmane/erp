// components/analytics/PerformanceChart.tsx
import { BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface PerformanceChartProps {
  data: number[];
  onMetricChange?: (metric: string) => void;
}

type Metric = 'CA' | 'Commandes' | 'Visiteurs';

export function PerformanceChart({ data, onMetricChange }: PerformanceChartProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>('CA');
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const maxValue = Math.max(...data);

  const handleMetricChange = (metric: Metric) => {
    setActiveMetric(metric);
    onMetricChange?.(metric);
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-500" />
            Évolution des performances
          </h3>
          <p className="text-xs text-[var(--foreground-muted)]">Comparaison mensuelle</p>
        </div>
        <div className="flex gap-2">
          {(['CA', 'Commandes', 'Visiteurs'] as Metric[]).map((metric) => (
            <button
              key={metric}
              onClick={() => handleMetricChange(metric)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                activeMetric === metric
                  ? 'bg-indigo-500/10 text-indigo-500'
                  : 'hover:bg-[var(--accent)]/10'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64 flex items-end gap-2 mt-8">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-lg transition-all hover:from-indigo-400 hover:to-indigo-300"
              style={{ height: `${(value / maxValue) * 180}px` }}
            />
            <span className="text-[10px] text-[var(--foreground-muted)]">
              {months[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}