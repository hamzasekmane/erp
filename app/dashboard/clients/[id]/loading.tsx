export default function ClientDetailsLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Navigation Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          <div className="h-4 w-4 bg-[var(--card-bg)] rounded-full border border-[var(--border)]" />
          <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
        </div>
        <div className="h-10 w-24 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
      </div>

      {/* Carte principale Skeleton */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md rounded-[3rem] border border-[var(--border)] p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-28 h-28 bg-[var(--card-bg)] rounded-[2rem] border border-[var(--border)]" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
            <div className="h-4 w-32 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-[var(--card-bg)] rounded-[2rem] border border-[var(--border)] space-y-3">
            <div className="h-3 w-20 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
            <div className="h-8 w-32 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
            <div className="h-2 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          </div>
        ))}
      </div>

      {/* Tableau Skeleton */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md rounded-[2rem] border border-[var(--border)] overflow-hidden">
        {/* Table Header */}
        <div className="bg-[var(--card-bg)] border-b border-[var(--border)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
            </div>
            <div className="h-8 w-24 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="p-6 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="w-12 h-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
                <div className="h-3 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              </div>
              <div className="w-24 h-10 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
              <div className="w-28 h-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}