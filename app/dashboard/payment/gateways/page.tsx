// app/dashboard/payment/gateways/page.tsx
import { cookies } from "next/headers";
import { paymentService } from "@/app/services/paymentServices";
import { Gateway } from "@/app/types/payment";
import { CreditCard, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import GatewaysManager from "./GatewaysManager";

export const metadata = {
  title: "Velora ERP | Passerelles de Paiement",
  description: "Configuration et gestion des passerelles de paiement",
};

export default async function GatewaysPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  let gateways: Gateway[] = [];
  let hasError = false;
  let errorMessage = "";

  try {
    const fetched = await paymentService.getGateways(token);
    const rawGateways = Array.isArray(fetched) ? fetched : [];
    
    // تطبيع البيانات: ضمان وجود id
    gateways = rawGateways.map((g: any) => ({
      ...g,
      id: g._id || g.id,
      isActive: g.isActive ?? true,
      config: g.config || {},
    })) as Gateway[];
  } catch (error) {
    console.error("❌ Failed to fetch gateways:", error);
    hasError = true;
    errorMessage = error instanceof Error ? error.message : "Erreur de connexion au serveur";
  }

  // Mock data for development
  if (process.env.NODE_ENV === "development" && (hasError || gateways.length === 0)) {
    gateways = [
      {
        id: "stripe",
        _id: "stripe",
        name: "Stripe",
        code: "stripe",
        isActive: true,
        config: { webhookSecret: "whsec_..." },
        logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
      },
      {
        id: "paypal",
        _id: "paypal",
        name: "PayPal",
        code: "paypal",
        isActive: false,
        config: { clientSecret: "ELxxx", mode: "sandbox" },
        logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
      },
      {
        id: "flutterwave",
        _id: "flutterwave",
        name: "Flutterwave",
        code: "flutterwave",
        isActive: true,
        config: { encryptionKey: "FLWSECK-***" },
        logo: "https://flutterwave.com/images/logo-colored.svg",
      },
    ];
    hasError = false;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/payment"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <CreditCard size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • PAYMENT
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● GATEWAYS
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Passerelles de <span className="text-[var(--accent)]">Paiement</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gérez les méthodes de paiement et leurs configurations
              </p>
            </div>
          </div>
          
          <Link
            href="/dashboard/payment/gateways/new"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-black hover:bg-[var(--accent)]/90 transition-all"
          >
            <Plus size={14} />
            Nouvelle passerelle
          </Link>
        </div>

        {/* Error display */}
        {hasError && gateways.length === 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center">
            <p className="text-rose-500 font-bold">❌ {errorMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Gateways Grid */}
        <GatewaysManager initialGateways={gateways} token={token} />
      </div>
    </div>
  );
}