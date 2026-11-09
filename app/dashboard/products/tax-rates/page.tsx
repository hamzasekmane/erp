import React from "react";
import { Percent, ArrowLeft, Lightbulb, Receipt } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { taxService } from "@/app/services/taxService";
import TaxFormModal from "./TaxFormModal";
import TaxCard from "./TaxCard";

export default async function TaxRatesPage() {
  // 1. Get the auth token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 2. Fetch real data from your API
  let taxes = [];
  try {
    const response = await taxService.getAllTaxes(token);
    // Handle different API response structures (array or { data: [] })
    taxes = Array.isArray(response) ? response : response.data || [];
  } catch (error) {
    console.error("Fetch error:", error);
  }

  return (
    <div className="p-8 space-y-10 max-w-6xl mx-auto">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Link 
            href="/dashboard/products" 
            className="group flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-emerald-500 transition-all tracking-[0.2em]"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> 
            Retour au catalogue
          </Link>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Configurations <span className="text-emerald-500 text-shadow-sm">TVA</span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium italic">
            Gérez les taxes et les prélèvements fiscaux de votre établissement.
          </p>
        </div>

        {/* The Modal now handles the "Nouveau Taux" button internally */}
        <TaxFormModal token={token} />
      </div>

      {/* --- Dynamic Tax Grid --- */}
      {taxes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taxes.map((tax: any) => (
            <TaxCard key={tax._id} tax={tax} token={token} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[3.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <Receipt className="mx-auto text-zinc-300 mb-4" size={48} />
          <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">
            Aucun taux de taxe configuré pour le moment
          </p>
        </div>
      )}

      {/* --- Informational Hint --- */}
      <div className="p-8 rounded-[2.5rem] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 flex items-start sm:items-center gap-5 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm text-emerald-500 shrink-0">
          <Lightbulb size={24} />
        </div>
        <div>
          <h4 className="text-emerald-800 dark:text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">💡 Note importante</h4>
          <p className="text-[11px] font-bold text-emerald-700/70 dark:text-emerald-500/70 uppercase tracking-wider leading-relaxed">
            Ces taux seront appliqués lors de la facturation et du calcul des prix TTC. <br className="hidden md:block"/> 
            Assurez-vous de la conformité des taux avec la réglementation en vigueur.
          </p>
        </div>
      </div>
    </div>
  );
}