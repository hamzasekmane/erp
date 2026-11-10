// app/dashboard/settings/tenants/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  Building2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { settingsService } from "@/app/services/settingsService";
import { TenantDetails } from "@/app/components/settings/TenantDetails";
import { TenantStats } from "@/app/components/settings/TenantStats";
import { TenantUsers } from "@/app/components/settings/TenantUsers";
import { TenantSettings } from "@/app/components/settings/TenantSettings";
import { TenantActions } from "@/app/components/settings/TenantActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Velora ERP | Détails du tenant`,
    description: `Gestion du tenant ${id}`,
  };
}

export default async function TenantDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  const tenantRes = await settingsService.getTenantById(token, id);
  const tenant = tenantRes?.data;

  if (!tenant) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
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
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-2xl flex items-center justify-center">
                <Building2 size={24} className="text-[var(--accent)]" />
              </div>
              {tenant.status === "active" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[var(--background)] animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • TENANT_MANAGEMENT
                </span>
                <span
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${
                    tenant.status === "active"
                      ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                      : tenant.status === "suspended"
                        ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                        : "bg-rose-500/20 text-rose-500 border-rose-500/30"
                  }`}
                >
                  {tenant.status === "active"
                    ? "● ACTIF"
                    : tenant.status === "suspended"
                      ? "○ SUSPENDU"
                      : "○ INACTIF"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                {tenant.name}
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                {tenant.subdomain}.velora.com
              </p>
            </div>
          </div>
        </div>

        <TenantActions tenantId={id} tenantName={tenant.name} token={token} />
      </div>

      {/* STATS GRID */}
      <TenantStats tenant={tenant} />

      {/* MAIN CONTENT TABS */}
      <div className="space-y-6">
        <TenantDetails tenant={tenant} />
        <TenantUsers tenantId={id} token={token} />
        <TenantSettings tenant={tenant} token={token} />
      </div>
    </div>
  );
}