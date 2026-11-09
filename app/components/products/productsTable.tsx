"use client";

import Link from "next/link";
import { Edit3, ChevronLeft, ChevronRight, Eye, Package, SearchX } from "lucide-react";
import DeleteProductBtn from "@/app/components/products/DeleteProductBtn";
import StatusToggle from "@/app/components/products/StatusToggle";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface ProductsTableProps {
  products: any[];
  token: string;
  mode?: "inventory" | "catalog";
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ProductsTable({ products, pagination, token, mode = "catalog" }: ProductsTableProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.pages || 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[var(--background)]/50">
            <tr className="border-b border-[var(--border)]">
              <th className="p-5 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Produit</th>
              <th className="p-5 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Catégorie</th>
              
              {mode === "catalog" ? (
                <th className="p-5 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Prix Vente</th>
              ) : (
                <th className="p-5 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Valeur Stock</th>
              )}

              <th className="p-5 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Stock Status</th>
              <th className="p-5 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">État</th>
              <th className="p-5 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {products.map((p) => {
              const currentActiveStatus = p.status === 'active' || p.isActive === true;
              return (
                <tr key={p._id} className="group hover:bg-[var(--accent)]/5 transition-all duration-300">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[var(--accent)]/10 items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                        <Package size={16} />
                      </div>
                      <div>
                        <div className="font-black text-[var(--foreground)] group-hover:text-[var(--accent)] uppercase text-sm">
                          {p.name}
                        </div>
                        <div className="text-[9px] text-[var(--foreground-muted)] font-mono uppercase">
                          {p.code || "REF-P"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-[8px] font-black uppercase px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg">
                      {p.categoryId?.name || "Standard"}
                    </span>
                  </td>

                  <td className="p-5 font-black text-sm text-[var(--foreground)]">
                    {mode === "catalog" 
                      ? `${p.price.toLocaleString()} DA` 
                      : `${(p.stock * p.price).toLocaleString()} DA`
                    }
                  </td>

                  <td className="p-5">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                      p.stock <= 0 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                        : p.stock <= 5 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p.stock <= 0 ? 'bg-rose-500 animate-pulse' 
                          : p.stock <= 5 ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`} />
                      {p.stock <= 0 ? 'Rupture' : `${p.stock} ${p.unit || 'U'}`}
                    </div>
                  </td>

                  <td className="p-5">
                    <StatusToggle id={p._id} isActive={currentActiveStatus} token={token} />
                  </td>

                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-1">
                      <Link 
                        href={`/dashboard/products/${p._id}`} 
                        className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-all rounded-lg hover:bg-[var(--accent)]/10"
                      >
                        <Eye size={14} />
                      </Link>
                      <Link 
                        href={`/dashboard/products/edit/${p._id}`} 
                        className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-all rounded-lg hover:bg-[var(--accent)]/10"
                      >
                        <Edit3 size={14} />
                      </Link>
                      <DeleteProductBtn productId={p._id} productName={p.name} token={token} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="py-16 flex flex-col items-center text-[var(--foreground-muted)]">
          <SearchX size={40} className="opacity-20 mb-2" />
          <p className="text-[9px] font-black uppercase tracking-wider">Liste vide</p>
        </div>
      )}

      {/* Pagination */}
      {products.length > 0 && (
        <div className="px-6 py-3 border-t border-[var(--border)] flex justify-between items-center">
          <span className="text-[9px] font-black text-[var(--foreground-muted)] uppercase">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--accent)]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--accent)]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}