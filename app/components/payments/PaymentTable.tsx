"use client";

import { CreditCard, Eye, Edit3, Calendar, CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PaymentTable({ payments, pagination, onPageChange, onSearch }: any) {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'paid': return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'pending': return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-rose-50 text-rose-600 border-rose-100";
    }
  };

  return (
    <div className="space-y-4">
      {/* 🔍 Search Bar */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text"
          placeholder="Rechercher par référence..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-bold outline-none focus:border-blue-500/50 transition-all shadow-sm"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400 italic">Référence / ID</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400 italic">Montant</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400 italic">Méthode</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400 italic">Date</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400 italic">Statut</th>
                <th className="p-6 text-[10px] font-black uppercase text-zinc-400 italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {payments?.length > 0 ? (
                payments.map((payment: any) => (
                  <tr key={payment._id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase italic">#{payment.paymentNumber || payment._id.slice(-6)}</span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Facture: {payment.invoiceId?.invoiceNumber || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400 italic">
                        {payment.amount?.toLocaleString('fr-FR')} <span className="text-[10px]">MAD</span>
                      </span>
                    </td>
                    <td className="p-6 italic font-black text-[10px] uppercase text-zinc-500">{payment.method}</td>
                    <td className="p-6 text-[10px] font-black text-zinc-500">
                      {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase ${getStatusStyle(payment.status)}`}>
                        {payment.status === 'completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {payment.status}
                      </div>
                    </td>
                    <td className="p-6 text-right flex justify-end gap-2">
                       <Link href={`/dashboard/payment/${payment._id}`} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:text-blue-600 transition-colors"><Eye size={14} /></Link>
                       <Link href={`/dashboard/payment/edit/${payment._id}`} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:text-amber-500 transition-colors"><Edit3 size={14} /></Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="p-20 text-center text-zinc-400 italic font-black uppercase text-[10px]">Aucun résultat</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🔢 Pagination Control */}
        {pagination && pagination.pages > 1 && (
          <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-zinc-400">Page {pagination.page} sur {pagination.pages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 transition-all active:scale-90"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 transition-all active:scale-90"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}