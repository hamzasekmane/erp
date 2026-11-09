"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Layers, Loader2 } from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

export default function CategoryFilter({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("categoryId") || "";

  const onChange = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    if (id) {
      params.set("categoryId", id);
    } else {
      params.delete("categoryId");
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative w-full md:w-64 group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-cyan-500 transition-colors pointer-events-none">
        {isPending ? (
          <Loader2 size={18} className="animate-spin text-cyan-500" />
        ) : (
          <Layers size={18} />
        )}
      </div>

      <select
        value={currentCategory}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold uppercase tracking-tighter outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 appearance-none transition-all shadow-sm cursor-pointer"
      >
        <option value="">Toutes les catégories</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      
      {/* Flèche personnalisée pour le select */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}