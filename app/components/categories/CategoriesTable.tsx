"use client";
import { Edit3, Package, Layers, Eye } from "lucide-react";
import Link from "next/link";
import DeleteConfirm from "./DeleteConfirm";

interface CategoriesTableProps {
  categories: any[];
  token?: string;
}

export default function CategoriesTable({ categories, token }: CategoriesTableProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-50 dark:border-zinc-800/50">
            <th className="p-6 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Détails de la Famille</th>
            <th className="p-6 text-[10px] font-black uppercase text-zinc-400 text-center tracking-widest">Volume Stock</th>
            <th className="p-6 text-[10px] font-black uppercase text-zinc-400 text-right tracking-widest">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {categories.map((cat) => (
            <tr key={cat._id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-300">
              <td className="p-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110" 
                    style={{ backgroundColor: cat.color || "#0891b2" }}
                  >
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase italic text-zinc-800 dark:text-zinc-100 leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter line-clamp-1">
                      {cat.description || "Pas de description"}
                    </p>
                  </div>
                </div>
              </td>
              
              <td className="p-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/30 shadow-sm">
                  <Package size={14} className="text-cyan-500" />
                  <span className="font-black italic text-sm text-zinc-700 dark:text-zinc-200">
                    {cat.productsCount || 0}
                  </span>
                </div>
              </td>

              <td className="p-6">
                <div className="flex justify-end gap-2">
                  {/* --- زر العرض (Show) --- */}
                  <Link 
                    href={`/dashboard/categories/${cat._id}`} 
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-90"
                    title="Voir les détails"
                  >
                    <Eye size={18} />
                  </Link>

                  {/* --- زر التعديل (Edit) --- */}
                  <Link 
                    href={`/dashboard/categories/edit/${cat._id}`} 
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-90"
                    title="Modifier"
                  >
                    <Edit3 size={18} />
                  </Link>
                  
                  {/* --- زر الحذف (Delete) --- */}
                  <DeleteConfirm id={cat._id} name={cat.name} token={token} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {categories.length === 0 && (
        <div className="p-20 text-center bg-zinc-50/30 dark:bg-transparent">
          <Layers size={40} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
          <p className="text-zinc-400 font-black uppercase italic text-xs tracking-[0.2em]">
            Aucune catégorie trouvée dans le catalogue
          </p>
        </div>
      )}
    </div>
  );
}