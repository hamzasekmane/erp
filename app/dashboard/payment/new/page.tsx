"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Hash, 
  Banknote, 
  FileText, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { paymentService } from "@/app/services/paymentServices";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]); // لجلب قائمة العملاء
  
  const [formData, setFormData] = useState({
    clientId: "",
    invoiceId: "",
    amount: "",
    method: "Cash",
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });

  // محاكاة جلب العملاء (يمكنك ربطها بـ clientService الخاص بك)
  useEffect(() => {
    // fetchClients(); 
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.amount) {
      return toast.error("Veuillez remplir les champs obligatoires");
    }

    setLoading(true);
    try {
      const token = document.cookie.split('token=')[1]?.split(';')[0] || "";
      const res = await paymentService.create(formData, token);
      
      if (res) {
        toast.success("Transaction enregistrée avec succès !");
        router.push("/dashboard/payment");
        router.refresh();
      }
    } catch (error) {
      toast.error("Erreur lors de la création du paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link 
          href="/dashboard/payment" 
          className="group flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          Annuler et retourner
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl">
            <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-8">
              Nouveau <span className="text-blue-600">Paiement</span>
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Client Selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase italic text-zinc-500 ml-4">
                    <User size={12} /> Client <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm italic"
                  >
                    <option value="">Sélectionner un client</option>
                    <option value="1">Client Passage (Comptant)</option>
                    {/* Map clients here */}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase italic text-zinc-500 ml-4">
                    <Banknote size={12} /> Montant (MAD) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500/20 transition-all font-black text-lg italic"
                  />
                </div>

                {/* Method */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase italic text-zinc-500 ml-4">
                    <Hash size={12} /> Méthode
                  </label>
                  <select 
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm italic"
                  >
                    <option value="Cash">Espèces</option>
                    <option value="Transfer">Virement</option>
                    <option value="Cheque">Chèque</option>
                    <option value="Card">Carte Bancaire</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase italic text-zinc-500 ml-4">
                    <Calendar size={12} /> Date de réception
                  </label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-sm italic"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase italic text-zinc-500 ml-4">
                  <FileText size={12} /> Notes ou Références
                </label>
                <textarea 
                  rows={3}
                  placeholder="Ex: Paiement facture #1234..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-6 py-4 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm italic"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 rounded-[2rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase italic text-xs tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Enregistrer la transaction
              </button>
            </form>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <CheckCircle2 size={32} className="opacity-50" />
              <h3 className="text-xl font-black uppercase italic leading-none">Validation Rapide</h3>
              <p className="text-xs font-bold text-blue-100 italic leading-relaxed">
                Chaque paiement enregistré est automatiquement déduit du solde du client et mis à jour dans les rapports financiers.
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
               <Banknote size={160} />
            </div>
          </div>
          
          <div className="bg-zinc-100 dark:bg-zinc-800/50 p-8 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-700">
            <h4 className="text-[10px] font-black uppercase italic text-zinc-400 mb-4 tracking-widest">Conseil Sécurité</h4>
            <p className="text-[10px] font-bold text-zinc-500 italic leading-relaxed">
              Assurez-vous de vérifier le numéro de chèque ou de virement dans les notes pour faciliter le rapprochement bancaire ultérieur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}