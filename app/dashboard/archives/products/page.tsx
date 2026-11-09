import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Search,
  RefreshCw,
  Trash2,
  Filter,
  DollarSign,
  Box,
  Eye
} from "lucide-react";

export const metadata: Metadata = {
  title: "Velora ERP | Produits archivés",
  description: "Consultez et gérez vos produits archivés",
};

interface ArchivedProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  archivedDate: string;
  status: "archived" | "pending_deletion";
}

export default async function ArchivedProductsPage() {
  const archivedProducts: ArchivedProduct[] = [
    {
      id: "1",
      name: "Smartphone X100",
      sku: "PHN-001",
      category: "Électronique",
      price: 699.00,
      stock: 0,
      archivedDate: "2024-01-15",
      status: "archived",
    },
    {
      id: "2",
      name: "Tablette Pro",
      sku: "TAB-002",
      category: "Électronique",
      price: 499.00,
      stock: 0,
      archivedDate: "2024-01-20",
      status: "archived",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/archives"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl">
              <Package size={20} className="text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">
                  VELORA • ARCHIVES
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Produits <span className="text-purple-500">archivés</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gérez vos produits discontinués ou hors catalogue
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Total produits</p>
          <p className="text-2xl font-black text-purple-500">{archivedProducts.length}</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Valeur totale</p>
          <p className="text-2xl font-black text-emerald-500">
            {archivedProducts.reduce((sum, p) => sum + p.price, 0).toLocaleString()} €
          </p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Catégories</p>
          <p className="text-2xl font-black text-amber-500">
            {new Set(archivedProducts.map(p => p.category)).size}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <button className="px-4 py-2 border border-[var(--border)] rounded-xl text-sm flex items-center gap-2 hover:border-purple-500/50 transition-colors">
          <Filter size={14} />
          Filtres
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <tr>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Produit</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">SKU</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Catégorie</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Prix</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Stock</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Archivé le</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedProducts.map((product) => (
                <tr key={product.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors">
                  <td className="p-4 text-sm font-medium">{product.name}</td>
                  <td className="p-4 text-sm font-mono text-[var(--foreground-muted)]">{product.sku}</td>
                  <td className="p-4 text-sm">{product.category}</td>
                  <td className="p-4 text-sm font-medium text-emerald-500">{product.price.toLocaleString()} €</td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-500">
                      <Box size={10} />
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--foreground-muted)]">{product.archivedDate}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors" title="Voir">
                        <Eye size={16} className="text-purple-500" />
                      </button>
                      <button className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Restaurer">
                        <RefreshCw size={16} className="text-emerald-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}