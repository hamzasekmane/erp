import { ArrowRight, CheckCircle, Download, Receipt } from 'lucide-react';
import Link from 'next/link';
import { Invoice } from '../../types/subscription';

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
              <Receipt size={16} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-black">Factures récentes</h2>
          </div>
          <Link href="/dashboard/subscription/invoices" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
            Voir toutes
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
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
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-[var(--background)]/50 transition-colors">
                <td className="p-4 text-sm font-medium">{invoice.id}</td>
                <td className="p-4 text-sm text-[var(--foreground-muted)]">
                  {new Date(invoice.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-4 text-sm">{invoice.planName}</td>
                <td className="p-4 text-sm font-medium">{invoice.amount} {invoice.currency}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    <CheckCircle size={10} />
                    {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                  </span>
                </td>
                <td className="p-4">
                  <a href={invoice.downloadUrl} download className="p-1.5 hover:bg-[var(--accent)]/10 rounded-lg transition-colors inline-block">
                    <Download size={14} className="text-[var(--foreground-muted)]" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}