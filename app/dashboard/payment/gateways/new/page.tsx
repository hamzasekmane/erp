// app/dashboard/payment/gateways/new/page.tsx
import { cookies } from "next/headers";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import NewGatewayForm from "./NewGatewayForm";
import type { GatewayOption } from "@/app/types/payment"; // يمكنك إضافة هذا النوع إذا أردت

export const metadata = {
  title: "Velora ERP | Ajouter une passerelle",
  description: "Configurer une nouvelle passerelle de paiement",
};

// Documentation URLs for hint links
const SUPPORTED_GATEWAYS: GatewayOption[] = [
  { code: "stripe", name: "Stripe", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
  { code: "paypal", name: "PayPal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
  { code: "flutterwave", name: "Flutterwave", logo: "https://flutterwave.com/images/logo-colored.svg" },
  { code: "paystack", name: "Paystack", logo: "https://paystack.com/assets/img/logo.png" },
  { code: "mercadopago", name: "Mercado Pago", logo: "https://www.mercadopago.com/logo.png" },
];

export default async function NewGatewayPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Header - يبقى كما هو */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/payment/gateways"
            className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
          >
            <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
          </Link>
          <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
            <Plus size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                VELORA • PAYMENT
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                ● NEW GATEWAY
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
              Ajouter une <span className="text-[var(--accent)]">Passerelle</span>
            </h1>
            <p className="text-xs text-[var(--foreground-muted)] font-mono">
              Intégrez un nouveau service de paiement
            </p>
          </div>
        </div>

        {/* Form */}
        <NewGatewayForm token={token} supportedGateways={SUPPORTED_GATEWAYS} />
      </div>
    </div>
  );
}