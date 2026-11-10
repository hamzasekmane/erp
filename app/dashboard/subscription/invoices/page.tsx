import { apiBaseUrl } from "@/app/lib/apiBase";
import { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft, Download, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Velora ERP | Factures',
  description: 'Consultez toutes vos factures',
};

const API_BASE = apiBaseUrl();

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  downloadUrl: string;
  paymentNumber: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

async function fetchInvoices(token: string, page: number, limit: number): Promise<{ invoices: Invoice[]; pagination: PaginationInfo }> {
  const res = await fetch(`${API_BASE}/subscriptions/invoices?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch invoices');
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  const payments = json.data;
  const pagination = json.pagination;

  const invoices: Invoice[] = payments.map((p: any) => ({
    id: p.paymentNumber || p._id,
    date: p.date,
    amount: p.amount,
    currency: p.currency || 'EUR',
    status: p.status === 'completed' ? 'paid' : p.status === 'pending' ? 'pending' : 'failed',
    planName: p.reference?.includes('Professional') ? 'Professional' : 'Subscription',
    downloadUrl: '#',
    paymentNumber: p.paymentNumber,
  }));

  return { invoices, pagination };
}

interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);

  let invoices: Invoice[] = [];
  let pagination: PaginationInfo = { page: 1, limit: 10, total: 0, pages: 0 };
  let error = '';

  try {
    const result = await fetchInvoices(token, page, limit);
    invoices = result.invoices;
    pagination = result.pagination;
  } catch (err: any) {
    error = err.message || 'Impossible de charger les factures';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/dashboard/subscription"
          className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
        >
          <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
        </Link>
        <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
          <Download size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              VELORA • FACTURES
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Toutes les <span className="text-[var(--accent)]">factures</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Historique complet de vos paiements
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-[var(--background)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="p-4 text-left text-[10px] font-black uppercase">N° Facture</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Date</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Plan</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Montant</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Statut</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {error && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-red-500">
                    <AlertCircle size={20} className="inline mr-2" />
                    {error}
                  </td>
                </tr>
              )}
              {!error && invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--foreground-muted)]">
                    Aucune facture trouvée
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--background)]/50 transition-colors">
                  <td className="p-4 text-sm font-medium">{inv.paymentNumber || inv.id}</td>
                  <td className="p-4 text-sm text-[var(--foreground-muted)]">
                    {new Date(inv.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4 text-sm">{inv.planName}</td>
                  <td className="p-4 text-sm font-medium">
                    {inv.amount.toLocaleString()} {inv.currency}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${
                      inv.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : inv.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {inv.status === 'paid' && <CheckCircle size={10} />}
                      {inv.status === 'paid' ? 'Payée' : inv.status === 'pending' ? 'En attente' : 'Échouée'}
                    </span>
                  </td>
                  <td className="p-4">
                    <a
                      href={inv.downloadUrl}
                      download
                      className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg inline-block transition-colors"
                    >
                      <Download size={14} className="text-[var(--foreground-muted)]" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!error && pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-4 p-4 border-t border-[var(--border)]">
            <div className="text-xs text-[var(--foreground-muted)]">
              Page {pagination.page} sur {pagination.pages} ({pagination.total} factures)
            </div>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <Link
                  href={`/dashboard/subscription/invoices?page=${pagination.page - 1}&limit=${pagination.limit}`}
                  className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                </Link>
              )}
              {pagination.page < pagination.pages && (
                <Link
                  href={`/dashboard/subscription/invoices?page=${pagination.page + 1}&limit=${pagination.limit}`}
                  className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
        <p className="text-[8px] font-mono text-[var(--foreground-muted)]">
          Velora ERP • Historique des factures
        </p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[7px] font-mono text-[var(--foreground-muted)]">
            Paiement sécurisé • Stripe
          </span>
        </div>
      </div>
    </div>
  );
}