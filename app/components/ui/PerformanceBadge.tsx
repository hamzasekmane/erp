// app/components/UI/PerformanceBadge.tsx
import { TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceBadgeProps {
  rate: number;
}

export default function PerformanceBadge({ rate }: PerformanceBadgeProps) {
  const isGood = rate >= 75;
  const isAverage = rate >= 50 && rate < 75;
  
  return (
<div className={`
  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-black uppercase tracking-wider transition-all duration-300
  ${isGood 
    /* Using your OKLCH color: lime with 10% opacity bg and 20% border */
    ? 'bg-[oklch(76.8%_0.233_130.85)/0.1] text-[oklch(76.8%_0.233_130.85)] border border-[oklch(76.8%_0.233_130.85)/0.2]' 
    : isAverage 
      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' 
      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  }
`}>
  {isGood ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
  <span>{rate}% Recouvrement</span>
</div>
  );
}