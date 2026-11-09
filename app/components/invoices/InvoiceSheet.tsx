"use client";

import { CheckCircle2, Clock, Calendar, User, Receipt, Printer, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function InvoiceSheet({ invoice }: { invoice: any }) {
  const paidAmount = invoice.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || invoice.paidAmount || 0;
  const remainingAmount = (invoice.total || 0) - paidAmount;
  const isPaid = remainingAmount <= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:m-0 print:p-0 animate-in fade-in duration-700">
      {/* Actions Bar - Hidden on Print */}
      <div className="flex justify-between items-center bg-[#020617] p-4 rounded-[2.5rem] border border-white/5 print:hidden shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4 ml-4">
          <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest italic text-zinc-400">
            {isPaid ? 'Document Intégralement Soldé' : 'Règlement Partiel / Attente de Paiement'}
          </span>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-white/10 hover:bg-cyan-500/20 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-95 transition-all border border-white/10 hover:border-cyan-500/30"
        >
          <Printer size={16} strokeWidth={3} /> Imprimer la facture
        </button>
      </div>

      {/* Invoice Body */}
      <div className="bg-[#020617] p-16 rounded-[4rem] shadow-2xl border border-white/5 print:shadow-none print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-24">
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 rotate-3">
              <Receipt size={48} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-7xl font-black italic tracking-tighter uppercase leading-[0.8] mb-2 text-white">Facture</h1>
              <p className="text-zinc-500 font-bold text-lg tracking-[0.3em] uppercase">Ref. {invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="text-right space-y-3">
            <p className="font-black uppercase text-3xl italic leading-none text-cyan-400">VOTRE NOM S.A.R.L</p>
            <div className="text-[11px] text-zinc-400 font-bold leading-relaxed uppercase italic space-y-1">
              <p>Cité 05 Juillet, Villa 12</p>
              <p>16000, ALGER, ALGÉRIE</p>
              <p className="text-white font-black pt-2">NIF: 002416010012345</p>
            </div>
          </div>
        </div>

        {/* Client & Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-24">
          <div className="p-10 bg-white/5 backdrop-blur-sm rounded-[3.5rem] border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] italic font-black text-6xl uppercase select-none text-white">Client</div>
            <div className="flex items-center gap-2 mb-6 text-cyan-400">
              <User size={14} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Facturé à</span>
            </div>
            <p className="text-3xl font-black uppercase mb-3 leading-none tracking-tighter text-white">{invoice.clientId?.name}</p>
            <p className="text-xs text-zinc-400 font-bold leading-relaxed italic uppercase max-w-[200px]">
              {invoice.clientId?.address}<br />
              <span className="text-zinc-500">NIF: {invoice.clientId?.nif || "N/A"}</span>
            </p>
          </div>

          <div className="flex flex-col justify-center space-y-8 pl-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-500 italic block mb-2 tracking-widest">Date Émission</span>
                <p className="font-black text-sm text-white uppercase">{format(new Date(invoice.date), "dd MMMM yyyy", { locale: fr })}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-500 italic block mb-2 tracking-widest">Date Échéance</span>
                <p className="font-black text-sm text-rose-400 uppercase">{format(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: fr })}</p>
              </div>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div>
               <span className="text-[9px] font-black uppercase text-zinc-500 italic block mb-2 tracking-widest">Mode de règlement</span>
               <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Virement Bancaire / CCP / Cash</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-20">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 italic">
                <th className="py-6 text-left">Désignation</th>
                <th className="py-6 text-center">Qté</th>
                <th className="py-6 text-right">Prix Unit.</th>
                <th className="py-6 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {invoice.items?.map((item: any, index: number) => (
                <tr key={index} className="group">
                  <td className="py-8 font-black text-white uppercase text-sm tracking-tight">{item.description}</td>
                  <td className="py-8 text-center font-bold text-zinc-400 text-sm tracking-widest">{item.quantity}</td>
                  <td className="py-8 text-right font-bold text-zinc-400 text-sm italic">{item.unitPrice?.toLocaleString()} DA</td>
                  <td className="py-8 text-right font-black text-white italic text-xl">{(item.quantity * item.unitPrice).toLocaleString()} DA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end pt-12 border-t-2 border-white/10">
          <div className="w-full max-w-sm space-y-4">
            <div className="flex justify-between text-zinc-400 font-bold text-[10px] uppercase italic tracking-widest px-6">
              <span>Sous-total HT</span>
              <span>{invoice.subtotal?.toLocaleString()} DA</span>
            </div>
            <div className="flex justify-between text-cyan-400 font-black text-[10px] uppercase italic tracking-widest px-6">
              <span>Acomptes versés</span>
              <span>- {paidAmount.toLocaleString()} DA</span>
            </div>
            <div className={`p-12 rounded-[3.5rem] flex flex-col items-center justify-center gap-2 shadow-2xl transition-all ${
              isPaid ? 'bg-emerald-500 text-white' : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white'
            }`}>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Net à Payer</p>
              <p className="text-6xl font-black italic tracking-tighter leading-none">
                {remainingAmount.toLocaleString()} <span className="text-base not-italic opacity-50 uppercase">DA</span>
              </p>
            </div>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-32 pt-12 border-t border-white/10 text-center space-y-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.05em] leading-relaxed italic opacity-80">
            S.A.R.L VOTREENTREPRISE • Capital : 10.000.000 DA • RC : 24/00-1234567B20<br />
            NIF : 002416010012345 • AI : 16021001234 • CB : 001 00000 0000000000 00
          </p>
          <div className="flex justify-center gap-8 opacity-20 grayscale print:hidden">
             <div className="h-8 w-24 bg-white/10 rounded-lg" />
             <div className="h-8 w-24 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}