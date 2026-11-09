"use client";
import { Search, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function CategorySearch() {
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    term ? params.set("query", term) : params.delete("query");

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative w-full md:w-80">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
        {isPending ? <Loader2 size={16} className="animate-spin text-cyan-500" /> : <Search size={16} />}
      </div>
      <input
        type="text"
        placeholder="Filtrer les catégories..."
        defaultValue={searchParams.get("query")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-sm"
      />
    </div>
  );
}