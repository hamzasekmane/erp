import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Layers,
  ArrowRight,
  Edit,
  MoreHorizontal,
  Settings,
  AlertCircle,
  RefreshCw
} from "lucide-react";

import { clientGroupService } from "@/app/services/clientGroupService";
import { ClientGroup } from "@/app/types/clientGroup.types";
import SubscriptionExpired from "@/app/components/SubscriptionExpired";
import DeleteGroupButton from "@/app/components/Client/DeleteGroupButton";
import { ApiError } from "@/app/lib/apiFetch";

/* ============================= */
/* Types for Subscription Error */
/* ============================= */

interface SubscriptionError {
  success: false;
  error_code: "SUBSCRIPTION_EXPIRED";
  message: string;
  data: {
    expiredSince: string;
    daysOverdue: number;
  };
}

/* ============================= */
/* Page */
/* ============================= */

export default async function ClientGroupsPage() {

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  let groups: ClientGroup[] = [];
  let apiError = false;
  let subscriptionError: SubscriptionError | null = null;

  try {
    console.log("🔍 Fetching groups...");
    const response = await clientGroupService.getAllGroups(token);
    groups = response.data || [];
    console.log("✅ Groups fetched:", groups.length);
  } catch (error: any) {
    console.error("❌ Error caught in page.tsx:", error);
    
    const isSubscriptionExpired = 
      (error instanceof ApiError && error.error_code === "SUBSCRIPTION_EXPIRED") ||
      (error instanceof ApiError && error.message?.includes("منتهية")) ||
      (error instanceof ApiError && error.status === 403 && error.message?.includes("اشتراك")) ||
      (error.message?.includes("منتهية"));
    
    if (isSubscriptionExpired) {
      subscriptionError = {
        success: false,
        error_code: "SUBSCRIPTION_EXPIRED",
        message: error.message || "باقة الاشتراك منتهية، يرجى التجديد لاستعادة الصلاحيات",
        data: error.data || { 
          expiredSince: new Date().toISOString(), 
          daysOverdue: 0 
        }
      };
    } else {
      apiError = true;
    }
  }

  if (subscriptionError) {
    return <SubscriptionExpired error={subscriptionError} />;
  }

  const totalGroups = groups.length;
  const totalClients = groups.reduce((acc, g) => acc + (g.clientCount || 0), 0);
  const totalBalanceAll = groups.reduce((acc, g) => acc + (g.totalBalance || 0), 0);

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 space-y-8 animate-fade-in">

      {/* background blur - theme aware */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="relative animate-slide-up">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[var(--accent)]/20 to-blue-600/20 rounded-2xl">
                <Layers size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                  Groupes de
                  <span className="text-[var(--accent)] ml-2">Clients</span>
                  <span className="text-[var(--accent)]">.</span>
                </h1>
                <p className="text-[10px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.3em] mt-1">
                  Segmentation clients
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <StatPill label="Groupes" value={totalGroups} color="cyan" />
              <StatPill label="Clients" value={totalClients} color="indigo" />
              <StatPill label="Balance" value={`${totalBalanceAll.toLocaleString()} DA`} color="emerald" />
            </div>
          </div>

          <Link
            href="/dashboard/clients/groups/new"
            className="group relative flex items-center gap-3 bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[var(--accent)]/20 hover:scale-105 transition-all duration-300"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Nouveau Groupe</span>
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <SummaryCard 
            title="Groupes" 
            value={totalGroups.toString()}
            icon={<Layers size={18} />}
            color="cyan"
            trend="Total"
          />
          <SummaryCard 
            title="Clients répartis" 
            value={totalClients.toString()}
            icon={<UsersIcon size={18} />}
            color="indigo"
            trend="Dans les groupes"
          />
          <SummaryCard 
            title="Balance cumulée" 
            value={`${totalBalanceAll.toLocaleString()} DA`}
            icon={<CreditCardIcon size={18} />}
            color="emerald"
            trend="Tous groupes"
          />
        </div>
      </div>

      {/* ================================= */}
      {/* API ERROR */}
      {/* ================================= */}

      {apiError && (
        <div className="relative bg-amber-500/10 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[var(--foreground)] font-medium">
              Impossible de charger les groupes.
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Une erreur est survenue. Veuillez réessayer ultérieurement.
            </p>
          </div>
          <Link
            href="/dashboard/clients/groups"
            className="flex items-center gap-2 bg-[var(--card-bg)] hover:bg-[var(--accent)]/10 px-4 py-2 rounded-xl text-xs transition-colors border border-[var(--border)]"
          >
            <RefreshCw size={12} />
            Réessayer
          </Link>
        </div>
      )}

      {/* ================================= */}
      {/* GROUPS GRID */}
      {/* ================================= */}

      <div className="relative">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.length > 0 ? (
            groups.map((group, index) => (
              <div key={group._id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
                <GroupCard group={group} token={token} />
              </div>
            ))
          ) : !apiError ? (
            <EmptyState />
          ) : null}
        </div>
      </div>

    </div>
  );
}

/* ============================= */
/* Stat Pill Component */
/* ============================= */

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors = {
    cyan: 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors[color as keyof typeof colors]} text-[8px] font-black uppercase transition-all hover:scale-105 duration-200`}>
      <span>{label}:</span>
      <span className="text-[var(--foreground)]">{value}</span>
    </div>
  )
}

/* ============================= */
/* Summary Card Component */
/* ============================= */

function SummaryCard({ title, value, icon, color, trend }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string;
  trend?: string;
}) {
  const colors = {
    cyan: 'border-[var(--accent)]/20 bg-[var(--accent)]/5',
    indigo: 'border-indigo-500/20 bg-indigo-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    rose: 'border-rose-500/20 bg-rose-500/5',
  }

  return (
    <div className={`p-5 rounded-2xl border ${colors[color as keyof typeof colors]} backdrop-blur-sm transition-all hover:scale-105 duration-300 cursor-pointer group`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider group-hover:text-[var(--accent)] transition-colors">{title}</p>
          <p className="text-xl font-black text-[var(--foreground)] mt-1">{value}</p>
          {trend && <p className="text-[7px] text-[var(--foreground-muted)]/60 mt-1">{trend}</p>}
        </div>
        <div className="p-2.5 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] group-hover:border-[var(--accent)]/30 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
      </div>
    </div>
  )
}

/* ============================= */
/* Group Card Component */
/* ============================= */

function GroupCard({ group, token }: { group: ClientGroup; token: string }) {
  return (
    <div className="group/card relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent)]/10">
      
      {/* Header with gradient */}
      <div className={`h-20 bg-gradient-to-r ${group.color || "from-[var(--accent)] to-blue-600"} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000"></div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--foreground)] group-hover/card:text-[var(--accent)] transition-colors line-clamp-1">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-xs text-[var(--foreground-muted)] mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 bg-[var(--card-bg)] rounded-xl p-1 opacity-0 group-hover/card:opacity-100 transition-all duration-300 border border-[var(--border)]">
            <ActionButton
              href={`/dashboard/clients/groups/edit/${group._id}`}
              icon={<Edit size={16} />}
              label="Modifier"
              color="cyan"
            />
            <ActionButton
              href={`/dashboard/clients/groups/settings/${group._id}`}
              icon={<Settings size={16} />}
              label="Paramètres"
              color="amber"
            />
            <DeleteGroupButton 
              groupId={group._id} 
              groupName={group.name}
              token={token} 
            />
            <ActionButton
              href="#"
              icon={<MoreHorizontal size={16} />}
              label="Plus"
              color="default"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
          <div>
            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider mb-1">
              Balance
            </p>
            <p className="font-black text-[var(--accent)] text-lg">
              {(group.totalBalance || 0).toLocaleString()} <span className="text-[8px] text-[var(--foreground-muted)]">DA</span>
            </p>
            <p className="text-[8px] text-[var(--foreground-muted)]/60 uppercase tracking-wider mt-1">
              {group.clientCount || 0} clients
            </p>
          </div>

          <div>
            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider mb-1">
              Créé le
            </p>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {new Date(group.createdAt).toLocaleDateString("fr-FR", {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
            <p className="text-[8px] text-[var(--foreground-muted)]/60 uppercase tracking-wider mt-1">
              {new Date(group.createdAt).toLocaleTimeString("fr-FR", {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* View Clients Link */}
        <Link
          href={`/dashboard/clients/groups/${group._id}`}
          className="flex justify-between items-center bg-[var(--card-bg)] p-4 rounded-xl hover:bg-[var(--accent)]/10 transition-all group/link border border-[var(--border)]"
        >
          <span className="text-xs uppercase tracking-wider font-black text-[var(--foreground-muted)] group-hover/link:text-[var(--accent)]">
            Voir les clients
          </span>
          <ArrowRight size={14} className="text-[var(--foreground-muted)] group-hover/link:text-[var(--accent)] group-hover/link:translate-x-1 transition-all duration-300" />
        </Link>

      </div>
    </div>
  )
}

/* ============================= */
/* Action Button Component */
/* ============================= */

function ActionButton({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  const colorClasses = {
    cyan: 'hover:text-[var(--accent)]',
    amber: 'hover:text-amber-400',
    default: 'hover:text-[var(--foreground)]',
  }

  return (
    <Link
      href={href}
      className={`p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-all duration-200 text-[var(--foreground-muted)] ${colorClasses[color as keyof typeof colorClasses]} group/action relative`}
      title={label}
    >
      {icon}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-[8px] font-black whitespace-nowrap opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none shadow-lg">
        {label}
      </span>
    </Link>
  )
}

/* ============================= */
/* Empty State */
/* ============================= */

function EmptyState() {
  return (
    <div className="col-span-full text-center py-20 bg-[var(--card-bg)] backdrop-blur-sm rounded-3xl border border-[var(--border)] animate-fade-in">
      <div className="p-4 bg-[var(--background)] rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-[var(--border)] group-hover:scale-110 transition-transform duration-300">
        <Layers size={32} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors" />
      </div>
      <h3 className="text-xl font-black uppercase tracking-tighter mb-3 text-[var(--foreground)]">
        Aucun groupe
      </h3>
      <p className="text-[var(--foreground-muted)] text-sm mb-8 max-w-md mx-auto">
        Créez votre premier groupe de clients pour commencer à organiser votre portefeuille.
      </p>
      <Link
        href="/dashboard/clients/groups/new"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--accent)] to-blue-600 hover:from-[var(--accent-dark)] hover:to-blue-700 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[var(--accent)]/20 hover:scale-105"
      >
        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
        Créer un groupe
      </Link>
    </div>
  )
}

/* ============================= */
/* Missing Icons */
/* ============================= */

function UsersIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CreditCardIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  )
}