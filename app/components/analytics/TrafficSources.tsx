// components/analytics/TrafficSources.tsx
import { Globe } from 'lucide-react';
import { TrafficSource } from '@/app/types/analytics.types';

interface TrafficSourcesProps {
  sources: TrafficSource[];
}

const colorGradients: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-400',
  blue: 'from-blue-500 to-blue-400',
  purple: 'from-purple-500 to-purple-400',
  amber: 'from-amber-500 to-amber-400',
  rose: 'from-rose-500 to-rose-400'
};

export function TrafficSources({ sources }: TrafficSourcesProps) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
      <h3 className="text-lg font-black flex items-center gap-2 mb-4">
        <Globe size={18} className="text-blue-500" />
        Sources de trafic
      </h3>
      <div className="space-y-4">
        {sources.map((source, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span>{source.source}</span>
              <span className="font-medium">{source.percentage}%</span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${colorGradients[source.color]} rounded-full`}
                style={{ width: `${source.percentage}%` }}
              />
            </div>
            <p className={`text-[10px] mt-1 ${source.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {source.change >= 0 ? '+' : ''}{source.change}% vs période précédente
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}