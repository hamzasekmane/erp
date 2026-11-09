"use client";

import { useState } from "react";
import { X, ShieldCheck, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { paymentService } from "@/app/services/paymentServices";
import { toast } from "sonner";

interface ModalProps {
  gateway: any;
  token: string;
  onClose: () => void;
}

export default function GatewaySettingsModal({ gateway, token, onClose }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    publicKey: gateway.publicKey || "",
    secretKey: gateway.secretKey || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // سنستخدم دالة التحديث الموجودة في السيرفيس
      const res = await paymentService.updateGatewayConfig(gateway._id, formData, token);
      if (res.success) {
        toast.success("Configuration mise à jour !");
        onClose();
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase italic italic leading-none">{gateway.name} Config</h2>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Paramètres API Sécurisés</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Public Key Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase italic ml-4 text-zinc-500">Client ID / Public Key</label>
              <input
                type="text"
                value={formData.publicKey}
                onChange={(e) => setFormData({...formData, publicKey: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                placeholder="pk_test_..."
              />
            </div>

            {/* Secret Key Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase italic ml-4 text-zinc-500">Secret Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={formData.secretKey}
                  onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium pr-14"
                  placeholder="sk_test_..."
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase italic text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Sauvegarder la configuration
            </button>
          </form>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center">
          <p className="text-[9px] text-zinc-400 font-bold uppercase italic tracking-tighter">
            Ces clés sont chiffrées de bout en bout avant d'être stockées.
          </p>
        </div>
      </div>
    </div>
  );
}