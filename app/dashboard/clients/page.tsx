import { cookies } from "next/headers"
import { 
  Plus, Phone, Eye, Edit2, User, XCircle, RefreshCw, Building2, 
  CreditCard, Calendar, Mail, MapPin, Activity 
} from "lucide-react"
import Link from "next/link"
import { clientService, SubscriptionExpiredError } from "@/app/services/clientService"
import { z } from "zod"
import { ClientSchema } from "@/app/types/client"
import DeleteClientBtn from "@/app/components/Client/DeleteClientBtn"
import ClientSearch from "@/app/components/Client/ClientSearch"
import SubscriptionExpired from "@/app/components/SubscriptionExpired"

type Client = z.infer<typeof ClientSchema>

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const IS_DEV = process.env.NODE_ENV === "development"

export default async function ClientsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <XCircle size={48} className="text-rose-400 mx-auto" />
          <p className="text-[var(--foreground-muted)]">Non authentifié</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-black text-xs uppercase tracking-wider">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const query = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, val]) => {
    if (val) query.append(key, String(val))
  })

  try {
    const response = await clientService.getAllClients(token, query.toString())
    const clients: Client[] = response?.data || []
    const totalCount = response?.pagination?.total || clients.length

    return (
      <ClientsTable
        clients={clients}
        totalCount={totalCount}
        searchQuery={params?.search as string}
      />
    )
  } catch (error: any) {
    if (error instanceof SubscriptionExpiredError) {
      return (
        <SubscriptionExpired
          error={{
            success: false,
            error_code: "SUBSCRIPTION_EXPIRED",
            message: error.message,
            data: error.data || {
              expiredSince: new Date().toISOString(),
              daysOverdue: 0,
            },
          }}
        />
      )
    }

    if (IS_DEV) console.error("Error loading clients:", error)
    return <ErrorState />
  }
}

/* ------------------------------------------------ */
/* Clients Table - Enhanced SaaS Version */
/* ------------------------------------------------ */

function ClientsTable({
  clients,
  totalCount,
  searchQuery,
}: {
  clients: Client[]
  totalCount: number
  searchQuery?: string
}) {
  // Calculate summary stats
  const totalBalance = clients.reduce((sum, client) => sum + (client.balance || 0), 0)
  const positiveBalanceCount = clients.filter(c => (c.balance || 0) > 0).length
  const negativeBalanceCount = clients.filter(c => (c.balance || 0) < 0).length

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 space-y-8">
      
      {/* Éléments décoratifs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Header Section */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[var(--accent)]/20 to-blue-600/20 rounded-2xl">
                <Building2 size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                  Clients
                  <span className="text-[var(--accent)] ml-2">.</span>
                </h1>
                <p className="text-[10px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.3em] mt-1">
                  Gestion du portefeuille client
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <StatPill 
                label="Total clients" 
                value={totalCount} 
                color="cyan"
              />
              <StatPill 
                label="Créanciers" 
                value={positiveBalanceCount} 
                color="rose"
              />
              <StatPill 
                label="Débiteurs" 
                value={negativeBalanceCount} 
                color="emerald"
              />
              {searchQuery && (
                <StatPill 
                  label="Recherche" 
                  value={`"${searchQuery}"`} 
                  color="amber"
                />
              )}
            </div>
          </div>

          <Link
            href="/dashboard/clients/new"
            className="group relative flex items-center gap-3 bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[var(--accent)]/20 hover:scale-105 transition-all duration-300"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Nouveau Client</span>
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <SummaryCard 
            title="Solde global" 
            value={`${totalBalance.toLocaleString()} DA`}
            icon={<CreditCard size={18} />}
            color="cyan"
            trend={totalBalance > 0 ? "Crédit" : "Débit"}
          />
          <SummaryCard 
            title="Moyenne par client" 
            value={`${Math.round(totalBalance / (clients.length || 1)).toLocaleString()} DA`}
            icon={<User size={18} />}
            color="indigo"
          />
          <SummaryCard 
            title="Taux d'activité" 
            value={`${Math.round((clients.filter(c => (c.balance || 0) !== 0).length / (clients.length || 1)) * 100)}%`}
            icon={<Activity size={18} />}
            color="emerald"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/20 to-blue-500/20 rounded-[2rem] blur-xl opacity-25" />
        <ClientSearch />
      </div>

      {/* Table Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/10 to-blue-500/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-700" />
        <div className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[2rem] overflow-hidden shadow-2xl">
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--card-bg)] border-b border-[var(--border)]">
                  <th className="px-8 py-5 text-left">
                    <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.2em]">Client</span>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.2em]">Code</span>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.2em]">Contact</span>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.2em]">Solde</span>
                  </th>
                  <th className="px-8 py-5 text-right">
                    <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-[0.2em]">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <ClientRow key={client._id} client={client} />
                  ))
                ) : (
                  <EmptyState searchQuery={searchQuery} />
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {clients.length > 0 && (
            <div className="px-8 py-4 border-t border-[var(--border)] bg-[var(--card-bg)]">
              <div className="flex items-center justify-between text-[8px] text-[var(--foreground-muted)]">
                <span>Affichage de {clients.length} client{clients.length > 1 ? 's' : ''}</span>
                <span>Total: {totalCount.toLocaleString()} enregistrements</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------ */
/* Summary Card Component */
/* ------------------------------------------------ */

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
    <div className={`p-5 rounded-2xl border ${colors[color as keyof typeof colors]} backdrop-blur-sm transition-all hover:scale-105 duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">{title}</p>
          <p className="text-xl font-black text-[var(--foreground)] mt-1">{value}</p>
          {trend && <p className="text-[7px] text-[var(--foreground-muted)]/60 mt-1">{trend}</p>}
        </div>
        <div className="p-2.5 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
          {icon}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------ */
/* Stat Pill Component */
/* ------------------------------------------------ */

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors = {
    cyan: 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors[color as keyof typeof colors]} text-[8px] font-black uppercase`}>
      <span>{label}:</span>
      <span className="text-[var(--foreground)]">{value}</span>
    </div>
  )
}

/* ------------------------------------------------ */
/* Address Display Component */
/* ------------------------------------------------ */

function AddressDisplay({ address }: { address: any }) {
  const formatAddress = (addr: any): string | null => {
    if (!addr) return null;
    
    // If address is already a string
    if (typeof addr === 'string') return addr;
    
    // If address is an object
    if (typeof addr === 'object') {
      const parts = [];
      if (addr.street) parts.push(addr.street);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.postalCode) parts.push(addr.postalCode);
      if (addr.country) parts.push(addr.country);
      
      return parts.length > 0 ? parts.join(', ') : null;
    }
    
    return null;
  };

  const formattedAddress = formatAddress(address);

  if (!formattedAddress) {
    return (
      <span className="text-[10px] text-[var(--foreground-muted)]/50 italic">
        Non renseigné
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1 text-[11px] text-[var(--foreground-muted)] group/address">
      <MapPin size={12} className="flex-shrink-0 text-[var(--accent)]/60" />
      <span 
        className="truncate max-w-[180px] md:max-w-[200px] cursor-help"
        title={formattedAddress}
      >
        {formattedAddress}
      </span>
    </div>
  );
}

/* ------------------------------------------------ */
/* Client Row - Enhanced */
/* ------------------------------------------------ */

function ClientRow({ client }: { client: Client }) {
  return (
    <tr className="group hover:bg-[var(--card-bg)] transition-all duration-300">
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] border border-[var(--border)] flex items-center justify-center font-black text-lg text-[var(--accent)] group-hover:scale-110 transition-transform duration-300">
              {client.name?.charAt(0).toUpperCase() || <User size={20} />}
            </div>
            {client.isActive === false && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[var(--background)]" />
            )}
          </div>
          <div>
            <p className="font-black text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {client.name}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {client.phone && (
                <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
                  <Phone size={10} /> {client.phone}
                </span>
              )}
              {client.email && (
                <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
                  <Mail size={10} /> {client.email}
                </span>
              )}
            </div>
          </div>
        </div>
       </td>

      <td className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
          <span className="text-[10px] font-mono font-black text-[var(--accent)]">
            {client.code || "N/A"}
          </span>
        </div>
      </td>

      <td className="text-center">
        <AddressDisplay address={client.address} />
      </td>

      <td className="text-center">
        <BalanceBadge balance={client.balance || 0} />
      </td>

      <td className="px-8 py-5 text-right">
        <div className="flex justify-end gap-2">
          <ActionLink
            href={`/dashboard/clients/${client._id}`}
            icon={<Eye size={16} />}
            label="Voir détails"
          />
          <ActionLink
            href={`/dashboard/clients/edit/${client._id}`}
            icon={<Edit2 size={16} />}
            label="Modifier"
          />
          <DeleteClientBtn id={client._id as string} name={client.name} />
        </div>
      </td>
    </tr>
  )
}

/* ------------------------------------------------ */
/* Balance Badge */
/* ------------------------------------------------ */

function BalanceBadge({ balance }: { balance: number }) {
  const isPositive = balance > 0
  const isNegative = balance < 0

  return (
    <div className={`inline-flex flex-col items-center px-4 py-2 rounded-xl ${
      isPositive ? 'bg-rose-500/10 border border-rose-500/30' :
      isNegative ? 'bg-emerald-500/10 border border-emerald-500/30' :
      'bg-[var(--card-bg)] border border-[var(--border)]'
    }`}>
      <span className={`text-sm font-black ${
        isPositive ? 'text-rose-400' :
        isNegative ? 'text-emerald-400' :
        'text-[var(--foreground-muted)]'
      }`}>
        {Math.abs(balance).toLocaleString("fr-DZ")} DA
      </span>
      <span className={`text-[8px] font-black uppercase ${
        isPositive ? 'text-rose-400/70' :
        isNegative ? 'text-emerald-400/70' :
        'text-[var(--foreground-muted)]/50'
      }`}>
        {isPositive ? 'DÛ' : isNegative ? 'CRÉDIT' : 'SOLDE NUL'}
      </span>
    </div>
  )
}

/* ------------------------------------------------ */
/* Action Link */
/* ------------------------------------------------ */

function ActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="p-2.5 text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-xl transition-all duration-200 group relative"
      title={label}
    >
      {icon}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-[8px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {label}
      </span>
    </Link>
  )
}

/* ------------------------------------------------ */
/* Empty State */
/* ------------------------------------------------ */

function EmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <tr>
      <td colSpan={5} className="text-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-[var(--card-bg)] rounded-full flex items-center justify-center border-2 border-[var(--border)]">
            <User size={40} className="text-[var(--foreground-muted)]" />
          </div>
          <p className="text-[var(--foreground-muted)] font-black uppercase text-xs tracking-wider">
            {searchQuery ? "Aucun client trouvé" : "Aucun client dans la base"}
          </p>
          <p className="text-[9px] text-[var(--foreground-muted)]/60">
            {searchQuery ? "Essayez d'autres critères" : "Commencez par ajouter votre premier client"}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/clients/new"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:scale-105 transition-transform"
            >
              <Plus size={14} />
              Ajouter un client
            </Link>
          )}
        </div>
      </td>
    </tr>
  )
}

/* ------------------------------------------------ */
/* Error State */
/* ------------------------------------------------ */

function ErrorState() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500/30">
          <XCircle size={48} className="text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--foreground)]">Erreur de chargement</h2>
          <p className="text-[var(--foreground-muted)] text-sm">
            Impossible de charger la liste des clients. Veuillez réessayer.
          </p>
        </div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[var(--accent-dark)] transition-all"
        >
          <RefreshCw size={16} />
          Réessayer
        </Link>
      </div>
    </div>
  )
}