export default function NewClientGroupLoading() {
  return (
    <div className="relative min-h-screen bg-[#020617] p-4 md:p-8 space-y-8 animate-pulse">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* En-tête Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10" />
          <div className="h-4 w-32 bg-white/5 rounded border border-white/10" />
        </div>
        <div className="h-8 w-40 bg-white/5 rounded-full border border-white/10" />
      </div>

      {/* Formulaire Skeleton */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-[3rem] p-8 md:p-10 space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-6">
            <div className="h-6 w-48 bg-white/5 rounded border border-white/10" />
            <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/10" />
            <div className="h-24 w-full bg-white/5 rounded-2xl border border-white/10" />
          </div>

          {/* Section 2 */}
          <div className="space-y-6">
            <div className="h-6 w-40 bg-white/5 rounded border border-white/10" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/10" />
              ))}
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-6">
            <div className="h-6 w-36 bg-white/5 rounded border border-white/10" />
            <div className="h-32 w-full bg-white/5 rounded-2xl border border-white/10" />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-8">
            <div className="flex-1 h-14 bg-white/5 rounded-2xl border border-white/10" />
            <div className="w-32 h-14 bg-white/5 rounded-2xl border border-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}