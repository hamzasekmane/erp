import { cookies } from "next/headers";
import { Metadata } from "next";
import { Building2, ArrowLeft, Save, Shield, Globe, Mail, Phone, User, Calendar, CreditCard, Database, Server } from "lucide-react";
import Link from "next/link";
import { CreateTenantForm } from "@/app/components/settings/CreateTenantForm";

export const metadata: Metadata = {
  title: "Velora ERP | Créer un tenant",
  description: "Création d'une nouvelle organisation",
};

export default async function NewTenantPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/settings/tenants" 
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <Building2 size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • MULTI_TENANCY
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  ● NEW_TENANT
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Créer un <span className="text-[var(--accent)]">tenant</span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] font-mono ml-14">
            Créez une nouvelle organisation avec sa propre base de données isolée
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="max-w-4xl mx-auto">
        <CreateTenantForm token={token} />
      </div>
    </div>
  );
}