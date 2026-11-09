// app/dashboard/products/page.tsx
import { cookies } from "next/headers";
import { productsService } from "@/app/services/products.Service";
import { taxService } from "@/app/services/taxService";
import ProductForm from "@/app/components/products/productsFrom";
import ProductSearch from "@/app/components/products/ProductSearch";
import CategoryFilter from "@/app/components/products/CategoryFilter";
import ProductsTable from "@/app/components/products/productsTable";
import StatCard from "@/app/components/StatCard";
import { Package, TrendingUp, Boxes, Tag, Plus, LayoutGrid } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const params = await searchParams;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val) query.append(key, String(val));
  });

  let productsRes, categoriesRes, statsRes, taxesRes;
  try {
    [productsRes, categoriesRes, statsRes, taxesRes] = await Promise.all([
      productsService.getAllProducts(token, query.toString()),
      productsService.getCategories(token),
      productsService.getStats(token),
      taxService.getAllTaxes(token),
    ]);
  } catch (error) {
    console.error("Erreur critique lors du chargement des données:", error);
  }

  const products = productsRes?.data || [];
  const pagination = productsRes?.pagination || null;
  const categories = categoriesRes?.data || [];
  const taxes = Array.isArray(taxesRes) ? taxesRes : taxesRes?.data || [];
  const summary = statsRes?.data?.summary || { totalProducts: 0, totalStockValue: 0, averageTaxRate: 0 };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Dynamic Background Element */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />

      <div className="relative p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
        
        {/* --- Header Section --- */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Package size={22} className="text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/80">
                    Inventory System
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">v2.0.4</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Catalogue <span className="text-emerald-500">.</span>
                </h1>
              </div>
            </div>
          </div>
          
          {/* Filters Bar */}
          <div className="w-full xl:w-auto flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
            <div className="w-full sm:w-64">
              <ProductSearch />
            </div>
            <div className="w-full sm:w-auto">
              <CategoryFilter categories={categories} />
            </div>
          </div>
        </header>

        {/* --- Stats Grid --- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard 
            label="Articles" 
            value={summary.totalProducts} 
            icon={<Package size={18} />} 
            color="blue"
            subLabel="Total catalogue"
          />
          <StatCard 
            label="Catégories" 
            value={categories.length} 
            icon={<Tag size={18} />} 
            color="emerald"
            subLabel="Segments actifs"
          />
          <StatCard 
            label="Valeur Stock" 
            value={`${(summary.totalStockValue / 1000).toFixed(1)}k`} 
            icon={<Boxes size={18} />} 
            color="amber"
            subLabel="K-DZD Total"
          />
          <StatCard 
            label="TVA" 
            value={`${summary.averageTaxRate?.toFixed(0) || 19}%`} 
            icon={<TrendingUp size={18} />} 
            color="purple"
            subLabel="Moyenne"
          />
        </section>

        {/* --- Main Dashboard Body --- */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Side: Form Container */}
          <aside className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-[2rem] p-1 shadow-inner">
                <div className="bg-zinc-950/40 rounded-[1.8rem] p-6 border border-white/5 shadow-xl">
                  <div className="flex items-center justify-between mb-8 px-2">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={16} className="text-emerald-500" />
                      <h2 className="text-xs font-black uppercase tracking-widest text-zinc-100">
                        Nouveau Produit
                      </h2>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-500">
                      LIVE
                    </div>
                  </div>
                  
                  <ProductForm categories={categories} taxes={taxes} token={token} />
                </div>
              </div>

              {/* Quick Tip Box */}
              <div className="hidden xl:block p-5 rounded-2xl border border-zinc-800/40 bg-zinc-900/10">
                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                  Tip: Utilisez des codes SKU normalisés pour améliorer la vitesse de recherche et la gestion des stocks.
                </p>
              </div>
            </div>
          </aside>

          {/* Center: Table Content */}
          <section className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
            <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
              <ProductsTable 
                products={products} 
                pagination={pagination} 
                token={token} 
                mode="catalog" 
              />
            </div>
          </section>
        </main>

        {/* --- Footer --- */}
        <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 py-8 border-t border-zinc-800/50 mt-12">
          <div className="flex items-center gap-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
              Velora Systems <span className="text-zinc-800 mx-2">|</span> 2026
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400">
                Database Sync: Active
              </span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}