// components/analytics/ActivityItem.tsx
import { ShoppingCart, Users, Package, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { RecentActivity } from '@/app/types/analytics.types';

interface ActivityItemProps {
  activity: RecentActivity;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'sale':
      return <ShoppingCart size={14} />;
    case 'user':
      return <Users size={14} />;
    case 'product':
      return <Package size={14} />;
    default:
      return <Activity size={14} />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle size={14} className="text-emerald-500" />;
    case 'warning':
      return <AlertCircle size={14} className="text-amber-500" />;
    default:
      return <Activity size={14} className="text-blue-500" />;
  }
};

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors">
      <div className="p-1.5 rounded-lg bg-indigo-500/10">
        {getTypeIcon(activity.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{activity.title}</p>
          {getStatusIcon(activity.status)}
        </div>
        <p className="text-[10px] text-[var(--foreground-muted)]">{activity.description}</p>
        <p className="text-[10px] text-[var(--foreground-muted)] mt-1">{activity.time}</p>
      </div>
    </div>
  );
}