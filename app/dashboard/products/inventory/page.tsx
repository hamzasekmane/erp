import { cookies } from "next/headers";
import { productsService } from "@/app/services/products.Service";
import ProductSearch from "@/app/components/products/ProductSearch";
import CategoryFilter from "@/app/components/products/CategoryFilter";
import ProductsTable from "@/app/components/products/productsTable";
import StatCard from "@/app/dashboard/StatCard";
import { AlertTriangle, TrendingUp, Layers, Boxes, ShieldAlert } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  const params = await searchParams;
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, val]) => {
    if (val) query.append(key, String(val));
  });

  let productsRes, categoriesRes, statsRes;
  try {
    [productsRes, categoriesRes, statsRes] = await Promise.all([
      productsService.getAllProducts(token, query.toString()),
      productsService.getCategories(token),
      productsService.getStats(token)
    ]);
  } catch (error) {
    console.error("Erreur:", error);
  }

  const products = productsRes?.data || [];
  const pagination = productsRes?.pagination || null;
  const categories = categoriesRes?.data || [];
  const summary = statsRes?.data?.summary || { totalProducts: 0, totalStockValue: 0, lowStockCount: 0 };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
            Inventaire <span className="text-rose-600">.</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1">
            Gestion des stocks en temps réel
          </p>
        </div>
        <div className="flex flex-col md:flex-row flex-1 md:justify-end items-center gap-3 w-full">
          <div className="w-full md:w-80"><ProductSearch /></div>
          <CategoryFilter categories={categories} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Stock Total" value={summary.totalProducts} icon={<Boxes size={20} />} color="indigo" trendValue="Unités" />
        <StatCard title="Valeur Stock" value={`${(summary.totalStockValue || 0).toLocaleString()} DA`} icon={<TrendingUp size={20} />} color="cyan" trendValue="Estimation" />
        <StatCard title="Alertes Rupture" value={summary.lowStockCount || 0} icon={<AlertTriangle size={20} />} color="rose" trendValue="Action requise" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-rose-50 dark:bg-rose-950/20 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30">
               <div className="flex items-center gap-3 mb-4 text-rose-600">
                 <ShieldAlert size={24} />
                 <h2 className="font-black uppercase text-xs tracking-widest italic">Alertes Critiques</h2>
               </div>
               <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-bold uppercase">
                 {summary.lowStockCount} Articles nécessitent un réapprovisionnement immédiat.
               </p>
            </div>
            <div className="bg-zinc-900 dark:bg-zinc-100 p-8 rounded-[2.5rem] text-white dark:text-zinc-900 shadow-2xl">
               <h3 className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">Audit de Flux</h3>
               <p className="text-[11px] opacity-70">Dernière mise à jour effectuée aujourd'hui à 08:00</p>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-8 xl:col-span-9">
           <div className="px-4 mb-4">
              <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400 flex items-center gap-2 italic">
                 <Layers size={14} className="text-rose-500" /> Registre Détaillé des Flux
              </h3>
           </div>
           <ProductsTable products={products} pagination={pagination} token={token} mode="inventory" />
        </div>
      </div>
    </div>
  );
}