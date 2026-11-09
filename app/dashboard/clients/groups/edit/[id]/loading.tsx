export default function EditClientGroupLoading() {
  return (
    <div className="relative min-h-screen bg-[#020617] p-4 md:p-8 max-w-3xl mx-auto space-y-8 animate-pulse">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]"></div>
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

      {/* Titre Skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-64 bg-white/5 rounded border border-white/10" />
        <div className="h-4 w-96 bg-white/5 rounded border border-white/10" />
      </div>

      {/* Informations rapides Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/10" />
        ))}
      </div>

      {/* Formulaire Skeleton */}
      <div className="h-[600px] bg-white/5 rounded-[3rem] border border-white/10" />
    </div>
  );
}