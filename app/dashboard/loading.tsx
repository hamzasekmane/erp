export default function DashboardLoading() {
  return (
    <div className="relative w-full space-y-6 animate-pulse pb-10">
      {/* HEADER SKELETON - مطابق للتصميم الأصلي */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 lg:h-14 w-64 bg-white/5 rounded-2xl"></div>
            <div className="h-8 w-24 bg-white/5 rounded-full"></div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-8 w-40 bg-white/5 rounded-full border border-white/10"></div>
            <div className="h-8 w-32 bg-cyan-500/10 rounded-full border border-cyan-500/20"></div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex flex-col">
              <div className="h-3 w-8 bg-zinc-700 rounded mb-1"></div>
              <div className="h-4 w-16 bg-zinc-600 rounded"></div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <div className="h-3 w-12 bg-cyan-700 rounded mb-1"></div>
              <div className="h-4 w-16 bg-cyan-600 rounded"></div>
            </div>
            <div className="h-6 w-12 bg-white/5 rounded-full"></div>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-500/20 rounded"></div>
              <div className="h-4 w-24 bg-zinc-600 rounded"></div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-zinc-700 rounded-full"></div>
              <div className="h-3 w-12 bg-zinc-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* STAT CARDS SKELETON - 4 بطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-white/10 rounded-full"></div>
                <div className="h-8 w-28 bg-white/15 rounded-lg"></div>
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10"></div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="h-2 w-32 bg-white/5 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* LEFT COLUMN - Charts & Invoices */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* CHART SKELETON - Area Chart مثل الأصلي */}
          <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-500/20 rounded"></div>
                <div className="h-4 w-36 bg-white/10 rounded-full"></div>
              </div>
              <div className="h-6 w-20 bg-white/5 rounded-full border border-white/10"></div>
            </div>
            
            {/* Area Chart Simulation */}
            <div className="relative h-[250px] mt-8">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-white/5"></div>
                ))}
              </div>
              
              {/* Area Chart Shape */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="skeleton-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area */}
                <path
                  d="M0,200 C100,150 200,180 300,120 C400,60 500,100 600,80 C700,60 800,100 900,150 L900,250 L0,250 Z"
                  fill="url(#skeleton-gradient)"
                  className="animate-pulse"
                />
                
                {/* Line */}
                <path
                  d="M0,200 C100,150 200,180 300,120 C400,60 500,100 600,80 C700,60 800,100 900,150"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
              </svg>
              
              {/* X-Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((month, i) => (
                  <div key={i} className="h-3 w-8 bg-white/5 rounded mt-4"></div>
                ))}
              </div>
            </div>
          </div>

          {/* INVOICES TABLE SKELETON */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-500/20 rounded"></div>
                <div className="h-4 w-36 bg-white/10 rounded-full"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 bg-white/5 rounded-full border border-white/10"></div>
                <div className="h-6 w-16 bg-white/5 rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 p-5 bg-white/5 border-b border-white/10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-3 w-16 bg-white/10 rounded-full"></div>
                ))}
              </div>
              
              {/* Table Rows */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 p-5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 rounded-lg"></div>
                    <div className="h-4 w-20 bg-white/10 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                    <div className="h-3 w-16 bg-white/5 rounded"></div>
                  </div>
                  <div className="h-4 w-16 bg-white/10 rounded"></div>
                  <div>
                    <div className="h-6 w-20 bg-white/5 rounded-full"></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <div className="w-8 h-8 bg-white/5 rounded-lg"></div>
                    <div className="w-8 h-8 bg-white/5 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Health Analysis */}
        <div className="space-y-6">
          <div className="sticky top-8">
            <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-3xl p-6 lg:p-8">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-500/20 rounded"></div>
                  <div className="h-4 w-32 bg-white/10 rounded-full"></div>
                </div>
                <div className="w-6 h-6 bg-white/5 rounded-lg"></div>
              </div>

              <div className="space-y-6">
                {/* Recovery Rate */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-cyan-500/20 rounded"></div>
                      <div className="h-3 w-28 bg-white/10 rounded-full"></div>
                    </div>
                    <div className="h-8 w-16 bg-white/10 rounded"></div>
                  </div>
                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute h-full w-3/4 bg-white/15 rounded-full"></div>
                  </div>
                  <div className="h-2 w-20 bg-white/5 rounded-full"></div>
                </div>

                {/* Stock Alerts */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500/20 rounded"></div>
                      <div className="h-3 w-20 bg-white/10 rounded-full"></div>
                    </div>
                    <div className="h-5 w-16 bg-amber-500/10 rounded-full border border-amber-500/20"></div>
                  </div>

                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 bg-amber-400/20 rounded"></div>
                              <div className="h-3 w-24 bg-white/10 rounded"></div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <div className="h-2 w-16 bg-white/5 rounded"></div>
                                <div className="h-2 w-20 bg-white/5 rounded"></div>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-amber-500 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                          <div className="w-4 h-4 bg-amber-500/20 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Status */}
                <div className="pt-4 border-t border-white/10">
                  <div className="p-5 bg-gradient-to-br from-zinc-900/50 to-black/50 rounded-2xl border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-xl w-10 h-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-20 bg-white/5 rounded-full"></div>
                        <div className="h-4 w-32 bg-white/10 rounded"></div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div>
                            <div className="h-2 w-8 bg-white/5 rounded mb-1"></div>
                            <div className="h-3 w-16 bg-white/10 rounded"></div>
                          </div>
                          <div>
                            <div className="h-2 w-8 bg-white/5 rounded mb-1"></div>
                            <div className="h-3 w-16 bg-white/10 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Loading Indicator - مثل الصورة */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="flex items-center gap-3 bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-full px-6 py-3 shadow-2xl">
          <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">
            CHARGEMENT DU TABLEAU...
          </span>
        </div>
      </div>

      {/* Loading Progress Bar - أختياري */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-cyan-500/20 z-50">
        <div className="h-full w-1/2 bg-cyan-500 rounded-full animate-loading"></div>
      </div>
    </div>
  );
}