"use client";

import { Search, X, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function ProductSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("search") || "");

  const debouncedSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  const onChange = (term: string) => {
    setValue(term);
    debouncedSearch(term);
  };

  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] group-focus-within:text-[var(--accent)] transition-colors">
        {isPending ? (
          <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
        ) : (
          <Search size={18} />
        )}
      </div>
      
      <input
        type="text"
        value={value}
        placeholder="Rechercher un produit ou un code..."
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl py-3 pl-12 pr-10 text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all shadow-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
      />

      {value && (
        <button 
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--accent)]/10 rounded-lg text-[var(--foreground-muted)] transition-colors"
        >
          <X size={14} />
        </button>
      )}

      {/* Subtle progress bar during server transition */}
      {isPending && (
        <div className="absolute -bottom-1 left-4 right-4 h-[2px] bg-[var(--accent)]/30 overflow-hidden rounded-full">
          <div className="h-full bg-[var(--accent)] animate-progress origin-left" />
        </div>
      )}
    </div>
  );
}