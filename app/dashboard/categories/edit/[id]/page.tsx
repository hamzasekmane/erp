import { productsService } from "@/app/services/products.Service";
import CategoryForm from "@/app/components/categories/CategoryForm";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Info } from "lucide-react";
import Link from "next/link";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. استخراج المعرف والتوكن بشكل آمن
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 2. جلب بيانات الفئة المحددة
  let category = null;
  try {
    // نستخدم التوكن هنا لجلب البيانات من السيرفر (Server-side Fetch)
    const categoryRes = await productsService.getCategoryById(id, token);
    category = categoryRes?.data;
  } catch (error) {
    console.error("Error loading category:", error);
  }

  // 3. عرض صفحة 404 إذا لم تكن الفئة موجودة
  if (!category) {
    notFound();
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex items-center gap-5">
        <Link 
          href="/dashboard/categories" 
          className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-cyan-600 hover:border-cyan-500/50 transition-all shadow-sm group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Layers size={16} className="text-cyan-600" />
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">
              Modifier <span className="text-cyan-600">.</span>
            </h1>
          </div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
            Édition de : {category.name}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 xl:col-span-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
            {/* تأكد من تحديث واجهة CategoryForm لتستقبل token 
               إذا كان الـ Action الخاص بالتعديل يحتاجه
            */}
            <CategoryForm initialData={category} isEditing={true} token={token} />
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-5 xl:col-span-6 hidden lg:block py-10">
          <div className="border-l-2 border-zinc-100 dark:border-zinc-800 pl-8 space-y-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-black uppercase italic tracking-widest text-zinc-400 mb-4">
                <Info size={14} className="text-cyan-600" />
                Guide rapide
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium max-w-xs">
                Modifier le nom ou la couleur affectera instantanément tous les produits liés à cette catégorie. 
              </p>
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Dernière mise à jour</p>
              <p className="text-xs font-black text-zinc-600 dark:text-zinc-300">
                {new Date(category.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}