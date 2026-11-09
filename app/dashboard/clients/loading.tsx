export default function LoadingClients() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] p-4 md:p-8 space-y-8 animate-pulse">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* En-tête Skeleton */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          <div className="h-4 w-48 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
        </div>
        <div className="h-14 w-40 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
                <div className="h-7 w-32 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              </div>
              <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Barre de recherche Skeleton */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/20 to-blue-500/20 rounded-[2rem] blur-xl opacity-25" />
        <div className="relative h-12 w-full bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]" />
      </div>

      {/* Tableau Skeleton */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/10 to-blue-500/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-700" />
        <div className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] overflow-hidden">
          
          {/* Table Header Skeleton */}
          <div className="bg-[var(--card-bg)] border-b border-[var(--border)] p-6">
            <div className="flex items-center gap-6">
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="h-4 w-16 bg-[var(--card-bg)] rounded border border-[var(--border)] ml-auto" />
            </div>
          </div>

          {/* Table Rows Skeleton */}
          <div className="p-6 space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-6">
                {/* Avatar Skeleton */}
                <div className="w-12 h-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
                
                {/* Name and Details Skeleton */}
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-[var(--card-bg)] rounded w-1/3 border border-[var(--border)]" />
                  <div className="h-3 bg-[var(--card-bg)] rounded w-1/4 border border-[var(--border)]" />
                </div>
                
                {/* Code Skeleton */}
                <div className="w-24 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
                
                {/* Contact Skeleton */}
                <div className="w-32 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)] hidden md:block" />
                
                {/* Balance Skeleton */}
                <div className="w-28 h-12 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
                
                {/* Actions Skeleton */}
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
                  <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
                  <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer Skeleton */}
          <div className="px-8 py-4 border-t border-[var(--border)] bg-[var(--card-bg)]">
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
                <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}