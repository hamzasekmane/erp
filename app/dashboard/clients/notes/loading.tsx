export default function ClientNotesLoading() {
  return (
    <div className="relative min-h-screen bg-[#020617] p-4 md:p-8 space-y-8 animate-pulse">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* En-tête Skeleton */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-3">
          <div className="h-12 w-64 bg-white/5 rounded-2xl border border-white/10" />
          <div className="h-4 w-48 bg-white/5 rounded-lg border border-white/10" />
        </div>
        <div className="h-12 w-36 bg-white/5 rounded-2xl border border-white/10" />
      </div>

      {/* Barre de recherche Skeleton */}
      <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/10" />

      {/* Notes épinglées Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-24 bg-white/5 rounded border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white/5 rounded-2xl border border-white/10" />
          ))}
        </div>
      </div>

      {/* Toutes les notes Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-white/5 rounded border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl border border-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}