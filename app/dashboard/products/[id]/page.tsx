import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { productsService } from "@/app/services/products.Service";
import DeleteProductBtn from "@/app/components/products/DeleteProductBtn";
import { 
  Package, 
  ArrowLeft, 
  BarChart3, 
  Edit3, 
  ShieldCheck, 
  Layers,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewProductPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  const res = await productsService.getById(id, token);
  const product = res?.data;

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link 
            href="/dashboard/products" 
            className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors font-bold uppercase text-[10px] tracking-wider"
          >
            <ArrowLeft size={14} /> Retour à l'inventaire
          </Link>
          
          <div className="flex items-center gap-2">
            <Link 
              href={`/dashboard/products/edit/${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-[9px] font-black uppercase transition-all shadow-sm active:scale-95"
            >
              <Edit3 size={12} className="text-[var(--accent)]" /> Modifier
            </Link>
            <DeleteProductBtn 
              productId={product._id} 
              productName={product.name} 
              token={token} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Product Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-sm relative overflow-hidden">
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-[9px] font-black uppercase tracking-tighter">
                      {product.categoryId?.name || "Général"}
                    </span>
                    {product.stock <= product.minStock && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                        <AlertCircle size={9} /> Stock Critique
                      </span>
                    )}
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-[var(--foreground)] uppercase leading-tight">
                    {product.name}
                  </h1>
                  
                  <p className="text-[var(--foreground-muted)] font-mono text-[9px] tracking-[0.2em] uppercase">
                    SKU—{product.code}
                  </p>
                </div>
                
                <div className="h-20 w-20 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center text-[var(--accent)] border border-[var(--border)]">
                  <Package size={32} strokeWidth={1.5} />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                  <p className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase mb-1 tracking-wider">Prix Vente</p>
                  <p className="text-xl font-black text-[var(--accent)] leading-none">
                    {product.price.toLocaleString()} <span className="text-[9px]">DA</span>
                  </p>
                </div>

                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                  <p className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase mb-1 tracking-wider">En Stock</p>
                  <p className={`text-xl font-black leading-none ${product.stock <= product.minStock ? 'text-rose-500' : 'text-[var(--foreground)]'}`}>
                    {product.stock} <span className="text-[8px] uppercase opacity-60 font-bold">{product.unit}</span>
                  </p>
                </div>

                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                  <p className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase mb-1 tracking-wider">Alerte</p>
                  <p className="text-xl font-black text-[var(--foreground)] leading-none">{product.minStock}</p>
                </div>

                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                  <p className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase mb-1 tracking-wider">Statut</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${product.isActive ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-rose-500'}`} />
                    <span className="font-black text-[8px] uppercase tracking-tighter">
                      {product.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-black uppercase text-[9px] tracking-wider text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                  <Layers size={12} /> Notes techniques
                </h3>
                <p className="text-[var(--foreground-muted)] text-sm leading-relaxed font-medium">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Analysis & Dates */}
          <div className="space-y-6">
            <div className="bg-[var(--accent)] rounded-2xl p-6 text-white shadow-lg shadow-[var(--accent)]/20 relative group overflow-hidden">
              <BarChart3 className="mb-3 opacity-20 group-hover:scale-110 transition-transform duration-500" size={32} />
              <h3 className="font-black uppercase tracking-tighter text-lg leading-tight mb-1">Analyse Rapide</h3>
              <p className="text-white/70 text-[9px] leading-relaxed mb-4 uppercase font-bold">
                Dernier mouvement de stock : <br />
                <span className="text-white text-xs">{new Date(product.updatedAt).toLocaleDateString('fr-FR')}</span>
              </p>
              <button className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-black uppercase text-[9px] transition-all border border-white/20">
                Historique des prix
              </button>
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={14} className="text-[var(--accent)]" />
                <h4 className="font-black uppercase text-[9px] tracking-wider text-[var(--foreground-muted)]">Fiche Identité</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                  <span className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase">Unité de mesure</span>
                  <span className="font-black text-[10px] uppercase italic text-[var(--foreground)]">{product.unit}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase">Date d'ajout</span>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--foreground-muted)]">
                    <Calendar size={10} />
                    {new Date(product.createdAt).toLocaleDateString()}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Product Details • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Fiche produit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}