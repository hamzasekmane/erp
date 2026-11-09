export default function NewClientNoteLoading() {
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

      {/* Formulaire Skeleton */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-[3rem] p-8 space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/10" />
        ))}
        <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
        <div className="h-12 bg-white/5 rounded-xl border border-white/10" />
        <div className="flex gap-4 pt-4">
          <div className="flex-1 h-14 bg-white/5 rounded-2xl border border-white/10" />
          <div className="w-32 h-14 bg-white/5 rounded-2xl border border-white/10" />
        </div>
      </div>
    </div>
  );
}