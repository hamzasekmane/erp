// app/dashboard/clients/new/page.tsx
import { Suspense } from "react";
import { cookies } from "next/headers";
import ClientForm from "@/app/components/Client/ClientForm";
import SubscriptionExpired from "@/app/components/SubscriptionExpired";
import { ArrowLeft, UserPlus, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";

// Skeleton Loader pendant le chargement
function FormSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] animate-pulse p-8 rounded-2xl space-y-4 border border-[var(--border)]">
      <div className="h-12 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]"></div>
      <div className="h-12 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]"></div>
      <div className="h-12 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]"></div>
      <div className="h-40 bg-[var(--card-bg)] rounded-2xl border border-[var(--border)]"></div>
    </div>
  );
}

// Vérification de l'abonnement (Server-side)
async function checkSubscription() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return false;

  // À remplacer par la vérification réelle via l'API
  const subscriptionValid = true; 
  return subscriptionValid;
}

export default async function NewClientPage() {
  const subscriptionValid = await checkSubscription();

  if (!subscriptionValid) {
    return (
      <SubscriptionExpired
        error={{
          success: false,
          error_code: "SUBSCRIPTION_EXPIRED",
          message: "Votre abonnement a expiré. Veuillez renouveler pour créer un nouveau client.",
          data: { expiredSince: new Date().toISOString(), daysOverdue: 0 },
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-20">

      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Bouton Retour */}
      <Link
        href="/dashboard/clients"
        className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--accent)] text-xs w-fit font-black uppercase tracking-widest italic transition-all group"
      >
        <div className="p-2 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-all">
          <ArrowLeft size={16} />
        </div>
        Retour à l'annuaire
      </Link>

      {/* Header Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-blue-600 rounded-[2.6rem] blur opacity-10 group-hover:opacity-20 transition duration-700"></div>
        <div className="relative flex items-center justify-between bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-[var(--accent)]/10 text-[var(--accent)] rounded-[2rem] flex items-center justify-center border border-[var(--accent)]/30">
                <UserPlus size={36} strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 bg-[var(--background)] p-1.5 rounded-full border border-[var(--border)]">
                <Sparkles size={12} className="text-amber-400 animate-pulse" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tighter italic uppercase">
                Nouveau Client
              </h1>
              <p className="text-[var(--foreground-muted)] text-sm mt-1 font-medium max-w-[280px]">
                Configurez les paramètres du compte et les coordonnées de facturation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire avec Suspense */}
      <Suspense fallback={<FormSkeleton />}>
        <ClientForm mode="create" />
      </Suspense>

      {/* Note d'information */}
      <div className="bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] p-6 rounded-[2.2rem] flex items-start gap-5">
        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/30">
          <ShieldAlert size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest italic">
            Contrôle d'unicité du code
          </h4>
          <p className="text-[11px] text-[var(--foreground-muted)] font-medium">
            Le <span className="text-amber-400 font-bold italic">Code Client</span> est l'identifiant pivot pour vos exports comptables.
            Assurez-vous qu'il ne soit pas déjà utilisé pour éviter les conflits lors de la génération automatique de vos factures.
          </p>
        </div>
      </div>
    </div>
  );
}