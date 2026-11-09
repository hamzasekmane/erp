import { cookies } from "next/headers";
import { invoiceService, InvoiceFilters, DateRangeHelper } from "@/app/services/invoice.service";
import InvoiceDownloadBtn from "@/app/components/InvoiceDownloadBtn";
import InvoiceSearch from "@/app/components/invoices/InvoiceSearch";
import AdvancedFilters from "@/app/components/invoices/AdvancedFilters";
import Pagination from "@/app/components/invoices/Pagination";
import DateRangeSelector from "@/app/components/invoices/DateRangeSelector";
import { 
  Plus, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Download,
  Eye,
  CreditCard,
  X,
  TrendingUp as TrendUp
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { parseAmount, formatDA } from "@/app/lib/utils";

// --- Types ---
interface Invoice {
  _id: string;
  invoiceNumber: string;
  total?: number;
  amount?: number;
  paidAmount?: number;
  balance?: number;
  status: 'paid' | 'draft' | 'overdue' | 'sent';
  date?: string;
  dueDate?: string;
  clientId?: {
    name?: string;
    code?: string;
  };
  clientName?: string;
}

type KpiColor = 'cyan' | 'amber' | 'emerald' | 'rose';

// --- Helpers ---
function processFiltersFromURL(searchParams: any): InvoiceFilters {
  const filters: InvoiceFilters = {
    page: Number(searchParams.page) || 1,
    limit: 10,
    query: searchParams.query?.trim(),
    status: searchParams.status !== 'all' ? searchParams.status : undefined,
  };

  if (searchParams.dateRange && searchParams.dateRange !== 'custom') {
    filters.dateRange = searchParams.dateRange;
  } else if (searchParams.month) {
    filters.month = searchParams.month;
  } else {
    if (searchParams.fromDate) filters.startDate = searchParams.fromDate;
    if (searchParams.toDate) filters.endDate = searchParams.toDate;
  }

  if (searchParams.minAmount) filters.minAmount = Number(searchParams.minAmount);
  if (searchParams.maxAmount) filters.maxAmount = Number(searchParams.maxAmount);
  if (searchParams.sortBy) filters.sortBy = searchParams.sortBy as any;
  if (searchParams.sortOrder) filters.sortOrder = searchParams.sortOrder as any;
  if (searchParams.clientId) filters.clientId = searchParams.clientId;

  return filters;
}

function getDateRangeLabel(filters: InvoiceFilters): string {
  if (filters.dateRange && filters.dateRange !== 'custom') {
    return DateRangeHelper.getRangeLabel(filters.dateRange);
  }
  if (filters.month) {
    const [year, month] = filters.month.split('-');
    return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: fr });
  }
  if (filters.startDate && filters.endDate) {
    return `${format(new Date(filters.startDate), 'dd/MM/yy')} - ${format(new Date(filters.endDate), 'dd/MM/yy')}`;
  }
  return 'Toutes les périodes';
}

// --- Page Principale ---
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  
  const rawParams = await searchParams;
  const filters = processFiltersFromURL(rawParams);
  
  const [invoicesData, globalStats] = await Promise.all([
    invoiceService.getAllInvoices(token, filters),
    invoiceService.getInvoiceStats(token, 'year')
  ]);

  const invoices: Invoice[] = invoicesData?.data || [];
  const globalStatsData = globalStats?.data || {};
  const totalPages = invoicesData?.pagination?.pages || 1;
  
  // Calcul optimisé des statistiques de la page (une seule boucle)
  const pageStats = invoices.reduce((acc, inv) => {
    const total = inv.total || inv.amount || 0;
    const paid = inv.paidAmount || 0;
    acc.total += total;
    acc.paid += paid;
    acc.due += (inv.balance || (total - paid));
    if (inv.status === 'paid' || (paid >= total && total > 0)) acc.paidCount++;
    return acc;
  }, { total: 0, paid: 0, due: 0, paidCount: 0 });

  const pageRecoveryRate = pageStats.total > 0 ? Math.round((pageStats.paid / pageStats.total) * 100) : 0;

  // Stats Globales
  const globalSummary = globalStatsData?.summary || {};
  const globalByStatus = globalStatsData?.byStatus || [];
  const globalPaid = globalByStatus.find((s: any) => s._id === 'paid') || { amount: 0, count: 0 };
  const globalOverdue = globalByStatus.find((s: any) => s._id === 'overdue') || { amount: 0, count: 0 };
  
  const globalRecoveryRate = globalSummary.total > 0 
    ? Math.round(((globalSummary.paid || 0) / globalSummary.total) * 100) 
    : 0;

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative space-y-8 p-4 md:p-6 lg:p-8 pb-10">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter italic">
              Facturation<span className="text-[var(--accent)] ml-1">.</span>
            </h1>
            <p className="text-[var(--foreground-muted)] text-[10px] font-black uppercase tracking-[0.3em] mt-2">
              Gestion du flux de trésorerie professionnel
            </p>
            
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <StatPill label="Total documents" value={globalSummary.count || 0} color="cyan" />
              <StatPill label="Taux recouvrement" value={`${globalRecoveryRate}%`} color="emerald" />
              {(filters.dateRange || filters.month || filters.startDate) && (
                <StatPill label="Filtre" value={getDateRangeLabel(filters)} color="amber" clearable />
              )}
            </div>
          </div>

          <Link 
            href="/dashboard/invoices/new"
            className="group relative flex items-center gap-4 bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-95 transition-all duration-500"
          >
            <Plus size={20} strokeWidth={3} /> 
            <span>Créer un document</span>
            <ArrowUpRight size={16} strokeWidth={3} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard title="Chiffre d'affaires" value={globalSummary.total || 0} icon={<TrendingUp size={20} />} trend={`+${globalRecoveryRate}%`} subtext={`${globalSummary.count} documents`} color="cyan" />
          <KpiCard title="Encours client" value={globalSummary.due || 0} icon={<Clock size={20} />} subtext={`${globalPaid.count || 0} factures soldées`} color="amber" />
          <KpiCard title="Recouvrement" value={globalSummary.paid || 0} icon={<CheckCircle2 size={20} />} subtext={`${globalRecoveryRate}% du CA`} color="emerald" />
          <KpiCard title="Impayés" value={globalOverdue.amount || 0} icon={<AlertCircle size={20} />} subtext={`${globalOverdue.count || 0} en retard`} color="rose" />
        </div>

        {/* Search & Filters */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)]/20 to-blue-500/20 rounded-[2.5rem] blur-xl opacity-25"></div>
          <div className="relative flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex-1"><InvoiceSearch /></div>
            <div className="flex items-center gap-3">
              <DateRangeSelector currentFilters={filters} />
              <AdvancedFilters currentFilters={filters} />
              <button className="p-4 bg-[var(--card-bg)] backdrop-blur-md border border-[var(--border)] rounded-2xl hover:border-emerald-500/50 transition-all">
                <Download size={18} className="text-[var(--foreground-muted)] hover:text-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="relative bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] backdrop-blur-md border border-[var(--border)] rounded-[3rem] overflow-hidden shadow-2xl">
          
          {/* Sub-header Page Stats */}
          <div className="px-8 py-4 bg-[var(--accent)]/5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <span className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">PAGE ACTUELLE</span>
                <StatBadge label="Montant" value={formatDA(pageStats.total)} color="cyan" />
                <StatBadge label="Payé" value={formatDA(pageStats.paid)} color="emerald" />
                <StatBadge label="Restant" value={formatDA(pageStats.due)} color="amber" />
                <StatBadge label="Taux" value={`${pageRecoveryRate}%`} color="purple" />
              </div>
              <div className="text-[8px] font-bold text-[var(--foreground-muted)]">
                {pageStats.paidCount} / {invoices.length} FACTURES RÉGLÉES
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--card-bg)] border-b border-[var(--border)]">
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Référence</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Client</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Émission</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Échéance</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Montant</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">Statut</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-[var(--accent)]/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <Link href={`/dashboard/invoices/${invoice._id}`} className="font-black text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{invoice.clientId?.name || invoice.clientName || '---'}</span>
                        <span className="text-[9px] text-[var(--foreground-muted)] font-bold italic uppercase">ID: {invoice.clientId?.code || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[var(--foreground-muted)] text-xs">
                      {invoice.date ? format(new Date(invoice.date), 'dd MMM yy', { locale: fr }) : '---'}
                    </td>
                    <td className="px-8 py-6 text-rose-400 text-xs">
                      {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yy', { locale: fr }) : '---'}
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-[var(--foreground)]">{formatDA(invoice.total ?? invoice.amount ?? 0)}</div>
                      {(invoice.paidAmount || 0) > 0 && (
                        <div className="text-[8px] text-emerald-400 font-bold uppercase">Payé: {formatDA(invoice.paidAmount || 0)}</div>
                      )}
                    </td>
                    <td className="px-8 py-6"><StatusBadge status={invoice.status} /></td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/invoices/${invoice._id}/payment`} className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-400"><CreditCard size={16} /></Link>
                        <Link href={`/dashboard/invoices/${invoice._id}`} className="p-2 hover:bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]"><Eye size={16} /></Link>
                        <InvoiceDownloadBtn invoiceId={invoice._id} invoiceNumber={invoice.invoiceNumber} token={token} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-[var(--border)] bg-[var(--card-bg)]/50">
              <div className="flex items-center justify-between">
                <Pagination totalPages={totalPages} />
                <span className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase italic">
                   {invoices.length} affichés sur {globalSummary.count || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Composants Internes ---
const KpiCard = ({ title, value, icon, trend, subtext, color }: { title: string, value: number, icon: React.ReactNode, trend?: string, subtext?: string, color: KpiColor }) => {
  const themes = {
    cyan: 'border-[var(--accent)]/20 text-[var(--accent)]',
    amber: 'border-amber-500/20 text-amber-400',
    emerald: 'border-emerald-500/20 text-emerald-400',
    rose: 'border-rose-500/20 text-rose-400',
  };

  return (
    <div className={`p-6 rounded-2xl border bg-white/[0.02] backdrop-blur-sm ${themes[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[8px] font-black uppercase text-[var(--foreground-muted)] tracking-widest">{title}</p>
          <h3 className="text-2xl font-black mt-2 text-[var(--foreground)]">{formatDA(value)}</h3>
          {subtext && <p className="text-[8px] text-[var(--foreground-muted)] mt-1 font-bold">{subtext}</p>}
        </div>
        <div className="p-3 bg-[var(--card-bg)] rounded-xl shadow-inner">{icon}</div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-4 text-[8px] font-black text-emerald-400 italic underline decoration-emerald-500/30">
          <TrendUp size={10} /> {trend}
        </div>
      )}
    </div>
  );
};

const StatPill = ({ label, value, color, clearable }: any) => {
  const themes: any = {
    cyan: 'bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${themes[color]} text-[8px] font-black uppercase tracking-tighter`}>
      <span className="opacity-70">{label}:</span>
      <span className="text-[var(--foreground)]">{value}</span>
      {clearable && (
        <Link href="/dashboard/invoices" className="ml-1 hover:bg-white/10 p-0.5 rounded-full transition-colors">
          <X size={10} />
        </Link>
      )}
    </div>
  );
};

const StatBadge = ({ label, value, color }: { label: string, value: string, color: string }) => {
  const colors: any = {
    cyan: 'text-[var(--accent)]',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] font-bold text-[var(--foreground-muted)] uppercase">{label}</span>
      <span className={`text-xs font-black ${colors[color]}`}>{value}</span>
    </div>
  );
};

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    overdue: "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const labels: any = { paid: "SOLDÉE", draft: "BROUILLON", overdue: "RETARD", sent: "ENVOYÉE" };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase border ${styles[status] || styles.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'paid' ? 'bg-emerald-400' : status === 'overdue' ? 'bg-rose-400' : 'bg-current'}`} />
      {labels[status] || status}
    </span>
  );
}