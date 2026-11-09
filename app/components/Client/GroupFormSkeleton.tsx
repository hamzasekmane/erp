"use client";

export function GroupFormSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Section 1 Skeleton - Informations générales */}
      <div className="space-y-6">
        <div className="h-6 w-48 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
        <div className="h-14 w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
        <div className="h-24 w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
      </div>

      {/* Section 2 Skeleton - Identité visuelle */}
      <div className="space-y-6 pt-4">
        <div className="h-6 w-40 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          ))}
        </div>
        <div className="h-16 w-full bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
      </div>

      {/* Section 3 Skeleton - Clients */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          <div className="h-10 w-36 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
        </div>
        <div className="h-32 w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
      </div>

      {/* Section 4 Skeleton - Paramètres avancés */}
      <div className="space-y-6 pt-4">
        <div className="h-6 w-44 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
        <div className="space-y-3">
          <div className="h-20 w-full bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          <div className="h-20 w-full bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
        </div>
      </div>

      {/* Boutons Skeleton */}
      <div className="flex gap-4 pt-8 border-t border-[var(--border)]">
        <div className="flex-1 h-14 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
        <div className="w-32 h-14 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
      </div>
    </div>
  );
}