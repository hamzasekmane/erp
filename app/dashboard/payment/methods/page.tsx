// app/dashboard/payment/methods/page.tsx
import { cookies } from "next/headers";
import { paymentService } from "@/app/services/paymentServices";
import { ArrowLeft, CreditCard, Wallet, Landmark, Smartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import PaymentMethodsManager from "./PaymentMethodsManager";

export const metadata = {
  title: "Velora ERP | Méthodes de Paiement",
  description: "Configuration des modes de règlement",
};

// Mock data for development (will be replaced by real API)
const getInitialMethods = async (token: string) => {
  // Try to fetch from API if exists, otherwise return mock
  try {
    // You can create a new endpoint in paymentService if needed
    // For now, we'll use mock data
    return [
      { id: "cash", name: "Espèces", code: "cash", isActive: true, icon: "wallet", description: "Paiement en espèces" },
      { id: "bank_transfer", name: "Virement bancaire", code: "bank_transfer", isActive: true, icon: "landmark", description: "Virement classique" },
      { id: "credit_card", name: "Carte bancaire", code: "credit_card", isActive: true, icon: "credit_card", description: "CB, Visa, Mastercard" },
      { id: "mobile_money", name: "Mobile Money", code: "mobile_money", isActive: false, icon: "smartphone", description: "Paiement via téléphone" },
      { id: "paypal", name: "PayPal", code: "paypal", isActive: false, icon: "credit_card", description: "Compte PayPal" },
    ];
  } catch (error) {
    console.error("Failed to fetch methods:", error);
    return [];
  }
};

export default async function PaymentMethodsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  const methods = await getInitialMethods(token);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
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
                  ● METHODS
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Méthodes de <span className="text-[var(--accent)]">Paiement</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Activez ou désactivez les modes de règlement acceptés
              </p>
            </div>
          </div>
        </div>

        {/* Client Component */}
        <PaymentMethodsManager initialMethods={methods} token={token} />

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Payment Methods • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Configuration temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}