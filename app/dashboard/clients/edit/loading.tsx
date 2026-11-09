export default function EditClientLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] p-4 md:p-8 max-w-3xl mx-auto space-y-6 animate-pulse">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Lien de retour Skeleton */}
      <div className="flex items-center gap-2 w-fit">
        <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
        <div className="h-4 w-32 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
      </div>

      {/* En-tête Skeleton */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[var(--card-bg)] rounded-3xl border border-[var(--border)]" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
            <div className="h-4 w-64 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          </div>
        </div>
      </div>

      {/* Client Info Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--border)] p-4 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]" />
            <div className="space-y-1 flex-1">
              <div className="h-2 w-16 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
              <div className="h-4 w-24 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire Skeleton */}
      <div className="space-y-6">
        {/* Section 1 */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)] space-y-4">
          <div className="h-6 w-40 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)] space-y-4">
          <div className="h-6 w-40 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)] space-y-4">
          <div className="h-6 w-40 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          </div>
        </div>

        {/* Section 4 - Address */}
        <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)] space-y-4">
          <div className="h-6 w-40 bg-[var(--card-bg)] rounded border border-[var(--border)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
            <div className="h-20 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]" />
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <div className="h-14 w-full bg-[var(--card-bg)] rounded-[2rem] border border-[var(--border)]" />
      </div>

      {/* Note d'avertissement Skeleton */}
      <div className="bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm border border-amber-500/30 p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl border border-amber-500/30" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-amber-500/20 rounded border border-amber-500/30" />
            <div className="h-3 w-full bg-amber-500/20 rounded border border-amber-500/30" />
            <div className="h-3 w-3/4 bg-amber-500/20 rounded border border-amber-500/30" />
          </div>
        </div>
      </div>
    </div>
  );
}