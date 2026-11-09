export default function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      
      {/* ===== HEADER SKELETON ===== */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-2xl w-14 h-14 border border-gray-300 dark:border-gray-700"></div>
            <div>
              <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"></div>
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg mt-2 border border-gray-300 dark:border-gray-700"></div>
            </div>
          </div>
          
          {/* Stats Pills */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700"></div>
            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700"></div>
          </div>
        </div>
        
        {/* Create Button Skeleton */}
        <div className="h-16 w-48 bg-gray-200 dark:bg-gray-800 rounded-[2rem] border border-gray-300 dark:border-gray-700"></div>
      </div>

      {/* ===== KPI CARDS SKELETON ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="p-6 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 backdrop-blur-sm"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"></div>
                <div className="h-2 w-24 bg-gray-200 dark:bg-gray-800 rounded mt-2 border border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-xl w-12 h-12 border border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700"></div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== QUICK SUMMARY SKELETON ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Brouillons Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-xl w-12 h-12 border border-gray-300 dark:border-gray-700"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-1 border border-gray-300 dark:border-gray-700"></div>
          <div className="h-2 w-32 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
        </div>

        {/* Soldées Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-xl w-12 h-12 border border-gray-300 dark:border-gray-700"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-1 border border-gray-300 dark:border-gray-700"></div>
          <div className="h-2 w-32 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
        </div>

        {/* Performance Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-xl w-12 h-12 border border-gray-300 dark:border-gray-700"></div>
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="absolute h-full w-3/4 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
          </div>
          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-800 rounded mt-3 border border-gray-300 dark:border-gray-700"></div>
        </div>
      </div>

      {/* ===== SEARCH & FILTERS SKELETON ===== */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gray-300/20 dark:bg-gray-700/20 rounded-[2.5rem] blur-xl"></div>
        <div className="relative flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex-1 h-14 bg-white dark:bg-gray-900 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl"></div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-14 bg-white dark:bg-gray-900 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl"></div>
            <div className="w-24 h-14 bg-white dark:bg-gray-900 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl"></div>
            <div className="w-14 h-14 bg-white dark:bg-gray-900 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl"></div>
          </div>
        </div>
      </div>

      {/* ===== TABLE SKELETON ===== */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gray-300/20 dark:bg-gray-700/20 rounded-[3.5rem] blur-2xl"></div>
        <div className="relative bg-white dark:bg-gray-900 backdrop-blur-md border border-gray-300 dark:border-gray-700 rounded-[3rem] overflow-hidden">
          
          {/* Page Stats */}
          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                  {[...Array(7)].map((_, i) => (
                    <th key={i} className="px-8 py-6">
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
                {[...Array(5)].map((_, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                    {[...Array(7)].map((_, colIndex) => (
                      <td key={colIndex} className="px-8 py-6">
                        {colIndex === 0 ? (
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gray-200 dark:bg-gray-800 rounded-xl w-10 h-10 border border-gray-300 dark:border-gray-700"></div>
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                          </div>
                        ) : colIndex === 1 ? (
                          <div className="space-y-1">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                          </div>
                        ) : colIndex === 2 || colIndex === 3 ? (
                          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                        ) : colIndex === 4 ? (
                          <div className="space-y-1">
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700"></div>
                          </div>
                        ) : colIndex === 5 ? (
                          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700"></div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg w-8 h-8 border border-gray-300 dark:border-gray-700"></div>
                            <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg w-8 h-8 border border-gray-300 dark:border-gray-700"></div>
                            <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg w-8 h-8 border border-gray-300 dark:border-gray-700"></div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Skeleton */}
          <div className="px-8 py-4 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-700"></div>
              <div className="flex gap-2">
                <div className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl w-10 h-10 bg-white dark:bg-gray-900"></div>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700"></div>
                  ))}
                </div>
                <div className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl w-10 h-10 bg-white dark:bg-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}