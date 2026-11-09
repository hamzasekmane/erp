"use client";

import { Search, Filter, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";

export default function InvoiceSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  // État local pour le texte pour un feedback immédiat
  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "");
  const currentStatus = searchParams.get("status") || "";

  // Effet de Debounce : attend 300ms après la frappe avant de changer l'URL
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchTerm) {
        params.set("query", searchTerm);
      } else {
        params.delete("query");
      }
      params.set("page", "1"); // Toujours revenir en page 1 lors d'une recherche

      startTransition(() => {
        replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1"); // Toujours revenir en page 1 lors d'un changement de filtre
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
      {/* Barre de recherche avec placeholder amélioré */}
      <div className="relative w-full md:w-96 group">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-cyan-500' : 'text-zinc-400'}`} size={18} />
        <input
          type="text"
          placeholder="N° facture, nom client, téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border-none shadow-sm focus:ring-2 ring-cyan-500/20 font-bold text-sm transition-all text-zinc-900 dark:text-zinc-100"
        />
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
             <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Info tooltip pour aider l'utilisateur */}
        <div className="absolute top-full left-0 mt-2 text-xs text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Recherche par: numéro de facture, nom du client ou téléphone
        </div>
      </div>

      {/* Filtres de Statut */}
      <div className="flex items-center p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl gap-1 overflow-x-auto max-w-full">
        <FilterButton active={currentStatus === ""} onClick={() => setStatus("")} label="Toutes" />
        <FilterButton active={currentStatus === "paid"} onClick={() => setStatus("paid")} label="Payées" color="text-emerald-500" />
        <FilterButton active={currentStatus === "viewed"} onClick={() => setStatus("viewed")} label="Consultées" color="text-blue-500" />
        <FilterButton active={currentStatus === "overdue"} onClick={() => setStatus("overdue")} label="Retards" color="text-rose-500" />
      </div>

      {/* Réinitialisation */}
      {(searchParams.get("query") || currentStatus) && (
        <button 
          onClick={() => { setSearchTerm(""); replace(pathname); }}
          className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 hover:underline whitespace-nowrap"
        >
          <X size={14} /> Réinitialiser
        </button>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, label, color = "text-zinc-500" }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
        active 
          ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white scale-105" 
          : `${color} opacity-50 hover:opacity-100 hover:bg-white/50 dark:hover:bg-zinc-700/50`
      }`}
    >
      {label}
    </button>
  );
}