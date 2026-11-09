"use client";

import { Search, X, Filter } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export default function PaymentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  // Debounce: انتظر 300ms بعد توقف المستخدم عن الكتابة قبل تحديث البحث
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Search Input */}
      <div className="relative flex-1 group">
        <Search 
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-blue-500 animate-pulse' : 'text-zinc-400 group-focus-within:text-zinc-900'}`} 
          size={18} 
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par client, référence ou montant..."
          className="w-full pl-12 pr-12 py-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white focus:ring-0 transition-all text-sm font-medium italic"
        />
        {query && (
          <button 
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={14} className="text-zinc-400" />
          </button>
        )}
      </div>

      {/* Status Filter Dropdown */}
      <div className="relative">
        <select 
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            if (e.target.value) params.set("status", e.target.value);
            else params.delete("status");
            router.replace(`${pathname}?${params.toString()}`);
          }}
          className="appearance-none pl-6 pr-12 py-4 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:border-zinc-300 transition-all focus:ring-0"
        >
          <option value="">Tous les statuts</option>
          <option value="paid">Payé</option>
          <option value="pending">En attente</option>
          <option value="failed">Échoué</option>
        </select>
        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
      </div>
    </div>
  );
}