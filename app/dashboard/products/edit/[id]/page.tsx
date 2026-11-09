import { cookies } from "next/headers";
import { productsService } from "@/app/services/products.Service";
import ProductForm from "@/app/components/products/productsFrom";
import { ArrowLeft, LayoutGrid, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Récupération de l'ID depuis l'URL et du token d'authentification 🔑
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 2. Récupération parallèle du produit et de la liste des catégories ⚡
  const [productRes, categoriesRes] = await Promise.all([
    productsService.getById(id, token),
    productsService.getCategories(token),
  ]);

  const product = productRes?.data;
  const categories = categoriesRes?.data || [];

  // 3. Sécurité : Si le produit n'existe pas, on renvoie vers une erreur 404 🚫
  if (!product) {
    notFound();
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SECTION HEADER : Navigation et Titre */}
      <div className="flex items-center gap-5">
        <Link 
          href="/dashboard/products" 
          className="group p-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 hover:border-cyan-500 transition-all shadow-sm"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            Édition Produit <span className="text-cyan-600">.</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-black text-zinc-500 uppercase">
              ID: {id.slice(-6)}
            </span>
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
              Dernière modification : {new Date(product.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNE PRINCIPALE : Formulaire */}
        <div className="lg:col-span-7 xl:col-span-8">
          <ProductForm 
            categories={categories} 
            initialData={product} 
            isEditing={true} 
            token={token} // ✅ تم تمرير التوكن هنا لحل مشكلة TS2741
          />
        </div>

        {/* COLONNE LATÉRALE : Infos rapides 📊 */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <Info size={14} /> État actuel du stock
            </h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black uppercase text-zinc-400">En main</p>
                <p className="text-2xl font-black">
                  {product.stock} <span className="text-sm text-zinc-400 font-bold">{product.unit}</span>
                </p>
              </div>
              
              {/* Jauge de stock visuelle */}
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    product.stock <= product.minStock ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min((product.stock / (product.minStock || 1)) * 100, 100)}%` }}
                />
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-black text-zinc-400 uppercase mb-1 tracking-tighter">Seuil d'alerte</p>
                <p className="font-bold text-sm text-rose-500 italic">{product.minStock} {product.unit}</p>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-950/20 p-6 rounded-[2rem] border border-cyan-100 dark:border-cyan-900/50">
            <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400">
              <LayoutGrid size={16} />
              <p className="text-[10px] font-black uppercase">Impact</p>
            </div>
            <p className="text-xs text-cyan-800 dark:text-cyan-300 leading-relaxed">
              Modifier la catégorie ou le prix impactera vos rapports de vente immédiatement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}