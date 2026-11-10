import { productsService } from "@/app/services/products.Service";
import { cookies } from "next/headers";
import CategoriesTable from "@/app/components/categories/CategoriesTable";
import CategorySearch from "@/app/components/categories/CategorySearch";
import { Tag, Plus, Layers, Package, BarChart3 } from "lucide-react";
import Link from "next/link";

// واجهة الخصائص لـ Next.js 15
interface PageProps {
  searchParams: Promise<{ query?: string }>;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  // 1. استخراج المعاملات والتوكن
  const { query = "" } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  let categories = [];
  let allProducts = [];

  // 2. جلب البيانات بالتوازي لسرعة الاستجابة
  try {
    const [catRes, prodRes] = await Promise.all([
      productsService.getCategories(token),
      productsService.getAllProducts(token), 
    ]);

    categories = catRes?.data || [];
    allProducts = prodRes?.data || [];
  } catch (error) {
    console.error("Data fetching error:", error);
  }

  // 3. ربط المنتجات بالفئات (حساب الإحصائيات)
  const categoriesWithCount = categories.map((cat: any) => ({
    ...cat,
    productsCount: allProducts.filter((p: any) => 
      p.categoryId === cat._id || p.category?._id === cat._id || p.category === cat._id
    ).length,
  }));

  // 4. التصفية بناءً على نص البحث
  const filteredCategories = categoriesWithCount.filter((cat: any) =>
    cat.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-cyan-600 rounded-lg text-white shadow-lg shadow-cyan-500/20">
              <Layers size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">
              Inventaire Global
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">
            Segments <span className="text-zinc-400">&</span> Familles
          </h1>
        </div>
        
        <Link 
          href="/dashboard/categories/new" 
          className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-white dark:text-zinc-950 text-white rounded-2xl font-black uppercase text-[11px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none"
        >
          <Plus size={18} /> Nouveau Segment
        </Link>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Familles" 
          value={categories.length} 
          icon={<Tag size={20} />} 
          color="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" 
        />
        <StatCard 
          label="Articles Classés" 
          value={allProducts.length} 
          icon={<Package size={20} />} 
          color="bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600" 
        />
        <StatCard 
          label="Taux d'utilisation" 
          value="100%" 
          icon={<BarChart3 size={20} />} 
          color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" 
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="w-full md:w-96">
          <CategorySearch />
        </div>
        <div className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest">
          Résultats : {filteredCategories.length} / {categories.length}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        <CategoriesTable categories={filteredCategories} token={token} />
      </div>

    </div>
  );
}

// مكون فرعي للبطاقات الإحصائية (داخلي)
function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`${color} p-6 rounded-[2rem] flex items-center justify-between shadow-sm border border-zinc-200/50 dark:border-zinc-800/50`}>
      <div>
        <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-tighter">{label}</p>
        <p className="text-3xl font-black italic tracking-tighter">{value}</p>
      </div>
      <div className="p-4 bg-white/40 dark:bg-black/20 rounded-2xl backdrop-blur-sm shadow-inner">
        {icon}
      </div>
    </div>
  );
}