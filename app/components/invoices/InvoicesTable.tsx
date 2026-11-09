"use client";

import { useTransition, useState } from "react";
import {
  Eye,
  Calendar,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Loader2,
  Ban,
  FileText,
  Trash2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { deleteInvoiceAction } from "@/app/actions/invoiceActions";
import { toast } from "sonner";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import PaymentModal from "@/app/components/invoices/PaymentModal";

export interface InvoiceTableItem {
  _id: string;
  invoiceNumber: string;
  total?: number;
  amount?: number;
  paidAmount?: number;
  dueAmount?: number;
  status: string;
  clientName?: string;
  clientId?: any;
  issueDate?: any;     
  date?: any;           
  createdAt?: any;      
  dueDate?: any;        
  payments?: any[];
}

interface InvoicesTableProps {
  invoices: InvoiceTableItem[];
  showClient?: boolean;
  showStatus?: boolean;
  showDate?: boolean;
  showDueDate?: boolean;
  showActions?: boolean;
  showPayment?: boolean;
  showDelete?: boolean;
  showPdf?: boolean;
  itemsPerPage?: number;
  showPagination?: boolean;
  basePath?: string;
  onDeleteSuccess?: () => void;
  onPaymentSuccess?: () => void;
  variant?: "full" | "compact";
}

const STATUS_CONFIG: Record<string, { bg: string; label: string; dot: string }> = {
  paid: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", label: "SOLDÉE", dot: "bg-emerald-400" },
  partially_paid: { bg: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30", label: "PARTIELLE", dot: "bg-[var(--accent)]" },
  draft: { bg: "bg-[var(--foreground-muted)]/10 text-[var(--foreground-muted)] border-[var(--foreground-muted)]/30", label: "BROUILLON", dot: "bg-[var(--foreground-muted)]" },
  overdue: { bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", label: "RETARD", dot: "bg-rose-400" },
  cancelled: { bg: "bg-[var(--foreground-muted)]/10 text-[var(--foreground-muted)] border-[var(--foreground-muted)]/30", label: "ANNULÉE", dot: "bg-[var(--foreground-muted)]" },
  pending: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", label: "EN ATTENTE", dot: "bg-amber-400" },
  sent: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/30", label: "ENVOYÉE", dot: "bg-blue-400" },
  viewed: { bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", label: "CONSULTÉE", dot: "bg-indigo-400" },
};

export default function InvoicesTable({
  invoices,
  showClient = true,
  showStatus = true,
  showDate = true,
  showDueDate = false,
  showActions = true,
  showPayment = true,
  showDelete = true,
  showPdf = true,
  itemsPerPage = 10,
  showPagination = true,
  basePath = "/dashboard/invoices",
  onDeleteSuccess,
  onPaymentSuccess,
  variant = "full",
}: InvoicesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceTableItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const getClientName = (inv: InvoiceTableItem) => {
    if (inv.clientName) return inv.clientName;
    if (typeof inv.clientId === 'object' && inv.clientId?.name) return inv.clientId.name;
    return "Client inconnu";
  };

  const getClientCode = (inv: InvoiceTableItem) => {
    if (typeof inv.clientId === 'object' && inv.clientId?.code) return inv.clientId.code;
    if (typeof inv.clientId === 'object' && inv.clientId?._id) return inv.clientId._id.slice(-6).toUpperCase();
    const technicalId = typeof inv.clientId === 'string' ? inv.clientId : inv._id;
    if (technicalId) return technicalId.slice(-6).toUpperCase();
    return "---";
  };

  const getIssueDate = (invoice: InvoiceTableItem) => {
    if (invoice.issueDate) {
      try {
        const d = new Date(invoice.issueDate);
        if (isValid(d)) return d;
      } catch (e) {}
    }
    if (invoice.date) {
      try {
        const d = new Date(invoice.date);
        if (isValid(d)) return d;
      } catch (e) {}
    }
    return null;
  };

  const formatDateLabel = (dateInput: any) => {
    if (!dateInput) return "---";
    const d = new Date(dateInput);
    return isValid(d) ? format(d, "dd MMM yy", { locale: fr }) : "---";
  };

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!invoiceToDelete) return;
    startTransition(async () => {
      const result = await deleteInvoiceAction(null, invoiceToDelete);
      if (result.success) {
        toast.success("Facture supprimée");
        setShowDeleteModal(false);
        onDeleteSuccess?.();
      }
    });
  };

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const displayedInvoices = showPagination 
    ? invoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) 
    : invoices;

  if (invoices.length === 0) return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-[var(--card-bg)] rounded-full border border-[var(--border)]">
          <FileText size={28} className="text-[var(--foreground-muted)]" strokeWidth={1} />
        </div>
        <p className="text-[var(--foreground-muted)] font-black uppercase tracking-widest text-[10px]">Aucune facture</p>
      </div>
    </div>
  );

  const isCompact = variant === "compact";
  const cellPadding = isCompact ? "px-3 py-2" : "px-6 py-5";
  const iconSize = isCompact ? 12 : 14;
  const fontSize = isCompact ? "text-[10px]" : "text-sm";

  return (
    <>
      <div className={`bg-[var(--background)] border border-[var(--border)] overflow-hidden ${
        isCompact ? "rounded-xl" : "rounded-[2rem] shadow-2xl"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--card-bg)] text-[var(--foreground-muted)] text-[8px] uppercase tracking-[0.2em] font-black border-b border-[var(--border)]">
                <th className={`${cellPadding}`}>Référence</th>
                {showClient && <th className={`${cellPadding}`}>Client</th>}
                {showDate && <th className={`${cellPadding} text-center`}>Émission</th>}
                {showDueDate && <th className={`${cellPadding} text-center`}>Échéance</th>}
                {showStatus && <th className={`${cellPadding}`}>Statut</th>}
                <th className={`${cellPadding} text-right`}>Montant</th>
                {showActions && <th className={`${cellPadding} text-right`}>Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {displayedInvoices.map((invoice) => {
                const total = Number(invoice.total ?? invoice.amount ?? 0);
                const paid = Number(invoice.paidAmount ?? 0);
                const issueDate = getIssueDate(invoice);

                return (
                  <tr key={invoice._id} className="hover:bg-[var(--card-bg)] transition-all duration-300 group">
                    {/* Référence */}
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[var(--card-bg)] rounded-md text-[var(--foreground-muted)] group-hover:bg-[var(--card-bg)]/80 border border-[var(--border)]">
                          <FileText size={iconSize} />
                        </div>
                        <Link 
                          href={`${basePath}/${invoice._id}`} 
                          className={`font-black ${isCompact ? 'text-xs' : 'text-sm'} text-[var(--foreground)] hover:text-[var(--accent)] transition-colors`}
                        >
                          {invoice.invoiceNumber || "SANS RÉF"}
                        </Link>
                      </div>
                    </td>

                    {/* Client */}
                    {showClient && (
                      <td className={cellPadding}>
                        <div className="flex flex-col">
                          <span className={`font-bold ${isCompact ? 'text-xs' : 'text-sm'} text-[var(--foreground)]`}>{getClientName(invoice)}</span>
                          <span className="text-[8px] text-[var(--foreground-muted)] font-bold uppercase tracking-tighter">
                            ID: {getClientCode(invoice)}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Date émission */}
                    {showDate && (
                      <td className={`${cellPadding} text-center`}>
                        <div className="flex items-center justify-center gap-1 text-[var(--foreground-muted)] font-bold text-[9px]">
                          <Calendar size={10} className="opacity-50" />
                          {issueDate ? formatDateLabel(issueDate) : "---"}
                        </div>
                      </td>
                    )}

                    {/* Date échéance */}
                    {showDueDate && (
                      <td className={`${cellPadding} text-center`}>
                        <div className="flex items-center justify-center gap-1 text-[var(--foreground-muted)] font-bold text-[9px]">
                          <Clock size={10} className="opacity-50" />
                          {invoice.dueDate ? formatDateLabel(invoice.dueDate) : "---"}
                        </div>
                      </td>
                    )}

                    {/* Statut */}
                    {showStatus && (
                      <td className={cellPadding}>
                        <StatusBadge status={invoice.status} compact={isCompact} />
                      </td>
                    )}

                    {/* Montant */}
                    <td className={`${cellPadding} text-right`}>
                      <div className="flex flex-col items-end">
                        <span className={`font-black ${isCompact ? 'text-sm' : 'text-lg'} text-[var(--foreground)] italic`}>
                          {total.toLocaleString('fr-DZ', { minimumFractionDigits: 0 })} <span className="text-[8px] text-[var(--foreground-muted)] not-italic">DA</span>
                        </span>
                        {paid > 0 && (
                          <span className="text-[7px] text-emerald-400 font-black tracking-tighter uppercase">
                            PAYÉ: {paid.toLocaleString('fr-DZ', { minimumFractionDigits: 0 })} DA
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    {showActions && (
                      <td className={`${cellPadding} text-right`}>
                        <div className="flex justify-end gap-1">
                          <Link 
                            href={`${basePath}/${invoice._id}`} 
                            className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-md transition-all"
                            title="Voir détails"
                          >
                            <Eye size={iconSize} />
                          </Link>
                          <button 
                            onClick={() => handleDeleteClick(invoice._id)} 
                            className="p-1.5 text-[var(--foreground-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={iconSize} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination compact */}
        {showPagination && totalPages > 1 && (
          <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--card-bg)] flex justify-between items-center">
            <span className="text-[8px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="p-1 border border-[var(--border)] rounded-lg disabled:opacity-20 hover:bg-[var(--card-bg)] transition-all"
              >
                <ArrowUpRight size={10} className="rotate-180" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="p-1 border border-[var(--border)] rounded-lg disabled:opacity-20 hover:bg-[var(--card-bg)] transition-all"
              >
                <ArrowUpRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleConfirmDelete} 
        isLoading={isPending} 
        title="Supprimer la facture" 
        message="Cette action est irréversible. Confirmer ?" 
      />

      {showPaymentModal && selectedInvoice && (
        <PaymentModal 
          invoice={selectedInvoice} 
          onClose={() => { setShowPaymentModal(false); onPaymentSuccess?.(); }} 
        />
      )}
    </>
  );
}

function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const s = status?.toLowerCase() || "draft";
  const config = STATUS_CONFIG[s] || STATUS_CONFIG.draft;
  const sizeClass = compact ? "px-2 py-0.5 text-[9px] gap-1" : "px-3 py-1.5 text-[10px] gap-2";
  const dotSize = compact ? "w-1 h-1" : "w-1.5 h-1.5";
  
  return (
    <span className={`inline-flex items-center rounded-full font-black tracking-widest transition-all border ${config.bg} ${sizeClass}`}>
      <span className={`${dotSize} rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}