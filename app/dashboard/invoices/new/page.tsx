import { apiBaseUrl } from "@/app/lib/apiBase";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  ArrowLeft, 
  FilePlus2, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  Users, 
  Package,
  RefreshCw,
  XCircle
} from "lucide-react";
import InvoiceForm from "@/app/components/invoices/InvoiceForm";
import SubscriptionExpired from "@/app/components/SubscriptionExpired";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function NewInvoicePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  
  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-sm">
          <XCircle className="mx-auto h-12 w-12 text-rose-400 mb-4" />
          <h2 className="text-xl font-black text-rose-400 uppercase tracking-wider">Session expirée</h2>
          <p className="text-[var(--foreground-muted)] mt-2">Veuillez vous reconnecter</p>
          <Link 
            href="/login" 
            className="inline-block mt-6 px-8 py-4 bg-rose-500 text-white rounded-xl font-black uppercase text-xs tracking-wider hover:bg-rose-400 transition-all"
          >
            Se reconnecter
          </Link>
        </div>
      </div>
    );
  }

  const API_URL = apiBaseUrl();

  if (IS_DEV) {
    console.log("🔍 Fetching clients and products...");
  }

  try {
    // ✅ Parallel fetching avec gestion d'erreur améliorée
    const [clientsRes, productsRes] = await Promise.allSettled([
      fetch(`${API_URL}/clients?limit=1000`, { 
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }),
      fetch(`${API_URL}/products?limit=1000&active=true`, { 
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 }
      }),
    ]);

    // ✅ Check for subscription expired errors in responses
    let subscriptionError: SubscriptionError | null = null;

    // Check clients response for 403
    if (clientsRes.status === 'fulfilled') {
      if (clientsRes.value.status === 403) {
        try {
          const errorData = await clientsRes.value.json();
          subscriptionError = {
            success: false,
            error_code: errorData?.error_code || "SUBSCRIPTION_EXPIRED",
            message: errorData?.message || "باقة الاشتراك منتهية",
            data: errorData?.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0
            }
          };
        } catch {
          subscriptionError = {
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: "باقة الاشتراك منتهية",
            data: {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0
            }
          };
        }
      }
    }

    // Check products response for 403
    if (!subscriptionError && productsRes.status === 'fulfilled') {
      if (productsRes.value.status === 403) {
        try {
          const errorData = await productsRes.value.json();
          subscriptionError = {
            success: false,
            error_code: errorData?.error_code || "SUBSCRIPTION_EXPIRED",
            message: errorData?.message || "باقة الاشتراك منتهية",
            data: errorData?.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0
            }
          };
        } catch {
          subscriptionError = {
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: "باقة الاشتراك منتهية",
            data: {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0
            }
          };
        }
      }
    }

    // Show subscription expired if detected
    if (subscriptionError) {
      return <SubscriptionExpired error={subscriptionError} />;
    }

    // ✅ Traitement sécurisé des réponses
    let clients: any[] = [];
    let products: any[] = [];
    let clientsError = false;
    let productsError = false;

    if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
      const data = await clientsRes.value.json().catch(() => ({}));
      clients = data.data || [];
      if (IS_DEV) console.log(`✅ Clients loaded: ${clients.length}`);
    } else {
      clientsError = true;
      if (IS_DEV) console.error("❌ Failed to load clients:", clientsRes);
    }

    if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
      const data = await productsRes.value.json().catch(() => ({}));
      products = data.data || [];
      if (IS_DEV) {
        console.log(`✅ Products loaded: ${products.length}`);
        if (products.length > 0) {
          console.log("📦 First product sample:", products[0]);
        }
      }
    } else {
      productsError = true;
      if (IS_DEV) console.error("❌ Failed to load products:", productsRes);
    }

    // If both failed completely
    if (clientsError && productsError) {
      return <CompleteErrorState />;
    }

    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        
        {/* ✅ Éléments décoratifs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]"></div>
        </div>

        {/* ✅ Navigation fixe */}
        <div className="sticky top-0 z-50 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link 
                href="/dashboard/invoices" 
                className="flex items-center gap-2 text-[var(--foreground-muted)] font-black uppercase text-[10px] tracking-widest hover:text-[var(--accent)] transition-all group"
              >
                <div className="p-2 rounded-full bg-[var(--card-bg)] backdrop-blur-sm border border-[var(--border)] group-hover:bg-[var(--accent)]/20 group-hover:border-[var(--accent)]/30 transition-all">
                  <ArrowLeft size={16} className="group-hover:text-[var(--accent)]" />
                </div>
                Annuler
              </Link>
              
              <div className="hidden md:flex items-center gap-2 text-[var(--accent)] bg-[var(--accent)]/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-[10px] font-black uppercase border border-[var(--accent)]/30">
                <Sparkles size={12} className="animate-pulse" /> 
                Nouvelle Facture
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${clientsError ? 'bg-amber-500/20' : 'bg-[var(--card-bg)]'}`}>
                  <Users size={14} className={clientsError ? 'text-amber-400' : 'text-[var(--accent)]'} />
                  <span className="text-[8px] font-black text-[var(--foreground-muted)]">
                    {clientsError ? '?' : clients.length}
                  </span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${productsError ? 'bg-amber-500/20' : 'bg-[var(--card-bg)]'}`}>
                  <Package size={14} className={productsError ? 'text-amber-400' : 'text-blue-400'} />
                  <span className="text-[8px] font-black text-[var(--foreground-muted)]">
                    {productsError ? '?' : products.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Contenu principal avec hauteur adaptative */}
        <div className="h-[calc(100vh-73px)] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
            
            {/* ✅ Layout en grille */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* ✅ Colonne gauche - Branding (sticky) */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
                
                {/* Logo animé */}
                <div className="relative group w-fit">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[var(--accent)] to-blue-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
                  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[var(--accent)] to-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl -rotate-3 group-hover:rotate-0 transition-all duration-500">
                    <FilePlus2 size={32} className="md:w-9 md:h-9" strokeWidth={1.5} />
                  </div>
                </div>
                
                {/* Titre */}
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-tight text-[var(--foreground)]">
                    Créer une <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-blue-400">
                      Facture
                    </span>
                  </h1>
                  <p className="text-[var(--foreground-muted)] font-bold text-xs uppercase tracking-tight leading-relaxed max-w-sm">
                    Gérez vos articles, appliquez des remises et calculez vos totaux en temps réel.
                  </p>
                </div>

                {/* ✅ Cartes de fonctionnalités */}
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] flex items-center gap-3 hover:border-[var(--border-hover)] transition-all duration-500 group">
                    <div className="p-2.5 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Zap size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Calcul Instantané</p>
                      <p className="text-xs font-bold text-[var(--foreground)]">Totaux mis à jour en direct</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] flex items-center gap-3 hover:border-[var(--border-hover)] transition-all duration-500 group">
                    <div className="p-2.5 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                      <ShieldCheck size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">Validation Cloud</p>
                      <p className="text-xs font-bold text-[var(--foreground)]">Synchronisation API sécurisée</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Colonne droite - Formulaire */}
              <div className="lg:col-span-8">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/20 to-blue-500/20 rounded-[2.5rem] blur-xl opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="p-6 md:p-8">
                      
                      {/* ✅ Messages d'avertissement */}
                      {clientsError && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                          <p className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-2">
                            <AlertCircle size={12} />
                            Impossible de charger les clients - Rafraîchissez la page
                          </p>
                        </div>
                      )}
                      
                      {!clientsError && clients.length === 0 && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                          <p className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-2">
                            <AlertCircle size={12} />
                            Aucun client trouvé - Créez d'abord un client
                          </p>
                        </div>
                      )}
                      
                      {productsError && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                          <p className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-2">
                            <AlertCircle size={12} />
                            Impossible de charger les produits - Rafraîchissez la page
                          </p>
                        </div>
                      )}
                      
                      {!productsError && products.length === 0 && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                          <p className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-2">
                            <AlertCircle size={12} />
                            Aucun produit trouvé - Ajoutez des produits au catalogue
                          </p>
                        </div>
                      )}

                      {/* ✅ Formulaire */}
                      <InvoiceForm 
                        clients={clients} 
                        products={products} 
                        token={token}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Footer */}
            <div className="flex justify-between items-center pt-6 mt-8 border-t border-[var(--border)]">
              <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)]/60 tracking-[0.3em]">
                VELORA ERP v2.0
              </p>
              <span className="text-[8px] text-[var(--foreground-muted)]/60 uppercase tracking-wider">
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    // Handle any unexpected errors
    if (IS_DEV) console.error("❌ Unexpected error:", error);
    
    // Check if it's a subscription expired error
    if (error?.status === 403 || error?.error_code === "SUBSCRIPTION_EXPIRED") {
      return (
        <SubscriptionExpired
          error={{
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: error?.message || "باقة الاشتراك منتهية",
            data: error?.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0
            }
          }}
        />
      );
    }
    
    return <CompleteErrorState />;
  }
}

/* ------------------------------------------------ */
/* Complete Error State */
/* ------------------------------------------------ */

function CompleteErrorState() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-12 text-center max-w-md backdrop-blur-sm">
        <XCircle size={48} className="text-rose-400 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-rose-400 mb-2 uppercase tracking-wider">Erreur de chargement</h1>
        <p className="text-[var(--foreground-muted)] mb-6">
          Impossible de charger les données nécessaires. Veuillez réessayer.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all"
          >
            Tableau de bord
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-2 bg-[var(--card-bg)] hover:bg-[var(--card-bg)]/80 text-[var(--foreground)] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-[var(--border)]"
          >
            <RefreshCw size={14} />
            Réessayer
          </Link>
        </div>
      </div>
    </div>
  );
}