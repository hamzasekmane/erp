"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const currentPage = Number(searchParams.get("page")) || 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    
    // scroll: false permet de rester au niveau du tableau après le clic
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Logique pour afficher les pages intelligemment (1 ... 4 5 6 ... 20)
  const getVisiblePages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      }
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
      <p className="text-[10px] font-black uppercase italic text-zinc-400 tracking-widest">
        Affichage page {currentPage} <span className="text-zinc-300 dark:text-zinc-600">/</span> {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-1">
          {visiblePages.map((page, index) => (
            <div key={page} className="flex items-center">
              {index > 0 && visiblePages[index - 1] !== page - 1 && (
                <span className="px-2 text-zinc-400 font-bold">...</span>
              )}
              <button
                onClick={() => handlePageChange(page)}
                className={`min-w-[40px] h-[40px] rounded-xl text-[10px] font-black transition-all ${
                  currentPage === page
                    ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-lg scale-110"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                }`}
              >
                {page}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}