import { cookies } from "next/headers";
import { productsService } from "@/app/services/products.Service";
import { taxService } from "@/app/services/taxService";
import ProductForm from "@/app/components/products/productsFrom";
import { 
  ArrowLeft, 
  PackagePlus, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  Box,
  AlertCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import SubscriptionExpired from "@/app/components/SubscriptionExpired";

interface SubscriptionError {
  success: false;
  error_code: "SUBSCRIPTION_EXPIRED";
  message: string;
  data: {
    expiredSince: string;
    daysOverdue: number;
  };
}

const IS_DEV = process.env.NODE_ENV === "development";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function checkSubscriptionExpired(response: Response): Promise<SubscriptionError | null> {
  if (response.status === 403) {
    try {
      const errorData = await response.json();
      if (errorData.error_code === "SUBSCRIPTION_EXPIRED") {
        return {
          success: false,
          error_code: "SUBSCRIPTION_EXPIRED",
          message: errorData.message || "باقة الاشتراك منتهية، يرجى التجديد",
          data: errorData.data || {
            expiredSince: new Date().toISOString(),
            daysOverdue: 0
          }
        };
      }
    } catch {
      return {
        success: false,
        error_code: "SUBSCRIPTION_EXPIRED",
        message: "باقة الاشتراك منتهية، يرجى التجديد",
        data: {
          expiredSince: new Date().toISOString(),
          daysOverdue: 0
        }
      };
    }
  }
  return null;
}

export default async function NewProductPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5 flex items-center justify-center p-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-8 max-w-md w-full text-center backdrop-blur-sm">
          <XCircle className="mx-auto h-12 w-12 text-rose-400 mb-4" />
          <h2 className="text-xl font-black text-rose-400 uppercase tracking-wider">Session expirée</h2>
          <p className="text-[var(--foreground-muted)] mt-2">Veuillez vous reconnecter</p>
          <Link 
            href="/login" 
            className="inline-block mt-6 px-8 py-4 bg-[var(--accent)] text-white rounded-xl font-black uppercase text-xs tracking-wider hover:bg-[var(--accent)]/90 transition-all"
          >
            Se reconnecter
          </Link>
        </div>
      </div>
    );
  }

  let categories = [];
  let taxes = [];
  let fetchError = null;
  let subscriptionError: SubscriptionError | null = null;

  try {
    if (IS_DEV) console.log("🔍 Fetching categories and taxes...");
    
    const [categoriesRes, taxesRes] = await Promise.allSettled([
      fetch(`${API_URL}/categories/type/product`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_URL}/taxes`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
    ]);

    if (categoriesRes.status === 'fulfilled') {
      const expired = await checkSubscriptionExpired(categoriesRes.value);
      if (expired) {
        subscriptionError = expired;
      } else if (!categoriesRes.value.ok) {
        fetchError = `Failed to fetch categories: ${categoriesRes.value.status}`;
        if (IS_DEV) console.error("❌ Categories error:", await categoriesRes.value.text());
      } else {
        const data = await categoriesRes.value.json();
        categories = data.data || data || [];
        if (IS_DEV) console.log(`✅ Categories loaded: ${categories.length}`);
      }
    } else {
      const error = categoriesRes.reason as any;
      fetchError = error?.message || "Failed to fetch categories";
      if (IS_DEV) console.error("❌ Categories error:", error);
    }

    if (!subscriptionError && taxesRes.status === 'fulfilled') {
      const expired = await checkSubscriptionExpired(taxesRes.value);
      if (expired) {
        subscriptionError = expired;
      } else if (!taxesRes.value.ok) {
        if (!fetchError) fetchError = `Failed to fetch taxes: ${taxesRes.value.status}`;
        if (IS_DEV) console.error("❌ Taxes error:", await taxesRes.value.text());
      } else {
        const data = await taxesRes.value.json();
        taxes = data.data || data || [];
        if (IS_DEV) console.log(`✅ Taxes loaded: ${taxes.length}`);
      }
    } else if (!subscriptionError && taxesRes.status === 'rejected') {
      const error = taxesRes.reason as any;
      if (!fetchError) fetchError = error?.message || "Failed to fetch taxes";
      if (IS_DEV) console.error("❌ Taxes error:", error);
    }

    if (subscriptionError) {
      if (IS_DEV) console.log("⚠️ Subscription expired detected");
      return <SubscriptionExpired error={subscriptionError} />;
    }

  } catch (error: any) {
    if (IS_DEV) console.error("❌ Error fetching initial data:", error);
    fetchError = error?.message || "Unknown error occurred";
  }

  if (fetchError && !subscriptionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5 flex items-center justify-center p-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-12 text-center max-w-md backdrop-blur-sm">
          <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-amber-400 mb-2 uppercase tracking-wider">Erreur de chargement</h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            {fetchError}
          </p>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--border)] hover:bg-[var(--accent)]/10 text-[var(--foreground)] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
          >
            <RefreshCw size={14} />
            Réessayer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <Link 
              href="/dashboard/products" 
              className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--accent)] font-black uppercase text-[10px] tracking-[0.2em] transition-all group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
              Retour à l'inventaire
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[var(--accent)] rounded-2xl text-white shadow-xl shadow-[var(--accent)]/20 rotate-3 transition-transform hover:rotate-0">
                <PackagePlus size={28} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-[var(--foreground)]">
                  Nouveau <span className="text-[var(--accent)]">Produit</span>
                </h1>
                <p className="text-[var(--foreground-muted)] font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                  <Sparkles size={12} className="text-amber-500 animate-pulse" /> Enregistrement d'un nouvel article
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <ShieldCheck size={14} className="text-[var(--accent)]" />
            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Validation Active</span>
          </div>
        </div>

        {/* Warning messages */}
        {categories.length === 0 && !subscriptionError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-[9px] font-black text-amber-400 uppercase flex items-center gap-2">
              <AlertCircle size={12} />
              Aucune catégorie trouvée - Créez d'abord une catégorie
            </p>
          </div>
        )}

        {taxes.length === 0 && !subscriptionError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-[9px] font-black text-amber-400 uppercase flex items-center gap-2">
              <AlertCircle size={12} />
              Aucune taxe trouvée - Configurez d'abord les taxes
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-8">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] dark:opacity-[0.05] pointer-events-none rotate-12 select-none">
                <Box size={300} />
              </div>
              <div className="p-6 md:p-8 relative z-10">
                <ProductForm 
                  categories={categories} 
                  taxes={taxes} 
                  token={token} 
                  isEditing={false} 
                />
              </div>
            </div>
          </div>

          {/* Sidebar Tips */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-[var(--card-bg)] border border-[var(--border)] p-6 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent)]/10 blur-[60px] rounded-full transition-all group-hover:scale-150" />
              
              <h4 className="flex items-center gap-2 text-[9px] font-black uppercase mb-6 italic tracking-wider text-[var(--foreground-muted)]">
                <Zap size={12} className="text-amber-500" /> Guide de saisie
              </h4>

              <ul className="space-y-5 relative z-10">
                {[
                  { label: "Référence", text: "Utilisez un code SKU unique pour faciliter le scan." },
                  { label: "Fiscalité", text: "Appliquez le taux de taxe correspondant (TVA, etc.)" },
                  { label: "Stock", text: "Définissez une alerte de stock minimum (Alerte Rouge)." }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 group/item">
                    <div className="h-5 w-5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center shrink-0 font-black text-[9px] transition-colors group-hover/item:bg-[var(--accent)] group-hover/item:text-white">
                      {idx + 1}
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed text-[var(--foreground-muted)]">
                      <span className="text-[var(--foreground)] font-black uppercase italic">{item.label} :</span> {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[9px] font-black text-[var(--accent)] uppercase tracking-wider mb-2 italic">Calcul Automatique</p>
                <p className="text-[10px] font-medium text-[var(--foreground-muted)] leading-relaxed">
                  Le système calculera automatiquement le prix TTC en fonction du taux de taxe sélectionné.
                </p>
              </div>
              <Sparkles className="absolute -bottom-2 -right-2 text-[var(--accent)]/10 transition-transform group-hover:scale-110" size={70} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • New Product • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Formulaire de création
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}