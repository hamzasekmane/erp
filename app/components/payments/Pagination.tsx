"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({ totalPages, currentPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {/* Previous Button */}
      <button
        onClick={() => router.push(createPageURL(currentPage - 1))}
        disabled={currentPage <= 1}
        className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          const isSelected = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => router.push(createPageURL(page))}
              className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                isSelected 
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 scale-110 shadow-lg" 
                : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => router.push(createPageURL(currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-100 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}