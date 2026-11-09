// frontend/app/components/Dashboard/NotificationSkeleton.tsx
export function NotificationListSkeleton() {
  return (
    <div className="divide-y divide-[var(--border)] bg-[var(--background)] rounded-[2rem] border border-[var(--border)] overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-6 animate-pulse">
          <div className="flex items-start gap-4">
            {/* Icon Skeleton */}
            <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            
            {/* Content Skeleton */}
            <div className="flex-1 space-y-3">
              {/* Title Skeleton */}
              <div className="h-4 bg-[var(--card-bg)] rounded w-3/4 border border-[var(--border)]" />
              
              {/* Message Skeleton */}
              <div className="space-y-2">
                <div className="h-3 bg-[var(--card-bg)] rounded w-full border border-[var(--border)]" />
                <div className="h-3 bg-[var(--card-bg)] rounded w-5/6 border border-[var(--border)]" />
              </div>
              
              {/* Date Skeleton */}
              <div className="flex items-center gap-4 pt-2">
                <div className="h-3 bg-[var(--card-bg)] rounded w-24 border border-[var(--border)]" />
              </div>
            </div>
            
            {/* Action Buttons Skeleton (hidden by default) */}
            <div className="flex items-center gap-2 opacity-0">
              <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
              <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
            </div>
          </div>
        </div>
      ))}
      
      {/* Load More Skeleton */}
      <div className="p-4 text-center border-t border-[var(--border)] bg-[var(--card-bg)]">
        <div className="h-4 bg-[var(--card-bg)] rounded w-24 mx-auto border border-[var(--border)]" />
      </div>
    </div>
  );
}

// ✅ Optional: Individual Notification Skeleton for more granular loading
export function NotificationItemSkeleton() {
  return (
    <div className="p-6 animate-pulse border-b border-[var(--border)] last:border-0">
      <div className="flex items-start gap-4">
        {/* Icon Skeleton */}
        <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] flex-shrink-0" />
        
        <div className="flex-1 space-y-3">
          {/* Header with title and unread indicator */}
          <div className="flex items-center gap-3">
            <div className="h-4 bg-[var(--card-bg)] rounded w-40 border border-[var(--border)]" />
            <div className="w-2 h-2 bg-[var(--card-bg)] rounded-full border border-[var(--border)]" />
          </div>
          
          {/* Message lines */}
          <div className="space-y-2">
            <div className="h-3 bg-[var(--card-bg)] rounded w-full border border-[var(--border)]" />
            <div className="h-3 bg-[var(--card-bg)] rounded w-5/6 border border-[var(--border)]" />
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-4 pt-2">
            <div className="h-3 bg-[var(--card-bg)] rounded w-32 border border-[var(--border)]" />
          </div>
        </div>
        
        {/* Action buttons placeholder */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
          <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
        </div>
      </div>
    </div>
  );
}

// ✅ Optional: Compact version for mobile or sidebar
export function NotificationItemSkeletonCompact() {
  return (
    <div className="p-4 animate-pulse border-b border-[var(--border)] last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[var(--card-bg)] rounded w-3/4 border border-[var(--border)]" />
          <div className="h-2 bg-[var(--card-bg)] rounded w-1/2 border border-[var(--border)]" />
        </div>
      </div>
    </div>
  );
}