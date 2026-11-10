// app/dashboard/payment/page.tsx
import { cookies } from "next/headers";
import { paymentService } from "@/app/services/paymentServices";
import { 
  Plus, 
  CreditCard, 
  Eye, 
  CircleDollarSign,
  CalendarDays,
  ArrowRightLeft,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import PaymentFilters from "@/app/components/payments/PaymentFilters";
import ExportExcelButton from "@/app/components/payments/ExportExcelButton";
import Pagination from "@/app/components/payments/Pagination";
import PaymentChart from "@/app/components/payments/PaymentChart";

interface PaymentPageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function PaymentListPage({ searchParams }: PaymentPageProps) {
  // 1. Resolve Params & Cookies
  const { search, status, page } = await searchParams;
  const currentPage = Number(page) || 1;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";

  // 2. Data Fetching
  let payments: any[] = [];
  let stats = { daily: [], totalAmount: 0 };
  let totalPages = 1;

  try {
    const [response, statsResponse] = await Promise.all([
      paymentService.getAll(token, { search, status, page: currentPage, limit: 10 }),
      paymentService.getStats(token)
    ]);

    if (response && response.success !== false) {
      payments = response.data || [];
      totalPages = response.pagination?.pages || 1;
    } else {
      payments = [];
      totalPages = 1;
    }
    
    const summary = statsResponse?.summary?.[0] || { total: 0, count: 0, avg: 0 };
    stats = {
      daily: statsResponse?.daily || [],
      totalAmount: summary.total
    };
    
    console.log("✅ Payments loaded:", payments.length);
  } catch (error) {
    console.error("❌ Failed to load payment data:", error);
  }

  // Prepare chart data
  const chartData = stats.daily.map((day: any) => ({
    date: day._id,
    amount: day.total
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
              <CircleDollarSign size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                  VELORA • PAYMENT
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  ● TRANSACTIONS
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Transactions<span className="text-[var(--accent)]">.</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Monitor real-time cash flow and payment gateways
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <ExportExcelButton data={payments} />
            <Link 
              href="/dashboard/payment/new" 
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase transition-all hover:bg-[var(--accent)]/90 shadow-lg"
            >
              <Plus size={14} />
              Nouveau Paiement
            </Link>
          </div>
        </div>

        {/* --- Analytics Overview --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                    <TrendingUp size={14} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="font-black">Flux de trésorerie</h3>
                </div>
                <p className="text-[9px] text-[var(--foreground-muted)] font-mono mt-1">
                  Activité des 7 derniers jours
                </p>
              </div>
              <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                <TrendingUp size={12} /> +12%
              </div>
            </div>
            <div className="h-[250px]">
              <PaymentChart data={chartData} />
            </div>
          </div>

          {/* Mini Stats Card */}
          <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/80 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <CreditCard size={100} className="absolute -right-8 -top-8 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Total Collecté</p>
              <h2 className="text-3xl font-black tracking-tighter">
                {stats.totalAmount.toLocaleString('fr-FR')}
                <span className="text-xs ml-1 opacity-70 font-bold">DZD</span>
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 mt-4 relative z-10">
              <p className="text-[8px] font-bold uppercase opacity-60">Statut Global</p>
              <p className="text-[10px] font-black">SANTÉ FINANCIÈRE : OPTIMALE</p>
            </div>
          </div>
        </div>

        {/* --- Navigation & Filters --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Link 
              href="/dashboard/payment/methods" 
              className="text-[9px] font-black uppercase text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-2 group"
            >
              <ArrowRightLeft size={12} className="group-hover:rotate-180 transition-transform duration-500" /> 
              Configurer les méthodes de paiement
            </Link>
          </div>

          <div className="bg-[var(--card-bg)]/50 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-4 sticky top-4 z-20">
            <PaymentFilters />
          </div>
        </div>

        {/* --- Table Container --- */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                  <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Réf / ID</th>
                  <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Client / Facture</th>
                  <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Date</th>
                  <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Montant</th>
                  <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Méthode</th>
                  <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">Statut</th>
                  <th className="p-4 text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {payments.length > 0 ? (
                  payments.map((payment: any) => (
                    <tr key={payment._id} className="group hover:bg-[var(--accent)]/5 transition-all duration-300">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-xs font-black uppercase text-[var(--foreground)]">
                            #{payment.paymentNumber || payment._id?.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[var(--foreground)] uppercase leading-tight">
                            {payment.clientId?.name || "Client Général"}
                          </span>
                          <span className="text-[9px] font-mono text-[var(--foreground-muted)] mt-0.5">
                            {payment.invoiceId?.invoiceNumber || "Facture Directe"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--foreground-muted)]">
                          <CalendarDays size={12} className="opacity-60" />
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-baseline gap-1 font-black text-[var(--foreground)]">
                          {payment.amount?.toLocaleString('fr-FR') || '0'}
                          <span className="text-[9px] text-[var(--foreground-muted)] font-mono">DZD</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]"></div>
                          <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)] tracking-wider">
                            {payment.method || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/dashboard/payment/${payment._id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
                        >
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <CreditCard size={60} strokeWidth={1} />
                        <p className="text-sm font-black uppercase tracking-wider">Aucune transaction</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Pagination Footer --- */}
        <div className="pt-4 pb-8">
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
          <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
            Velora ERP • Payment Transactions • v2.0.0
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
              Données mises à jour en temps réel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for Status Badge
function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status?.toLowerCase();
  const styles: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    failed: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase border tracking-wider ${styles[normalizedStatus] || "bg-[var(--accent)]/10 text-[var(--foreground-muted)] border-[var(--border)]"}`}>
      {status || 'Unknown'}
    </span>
  );
}