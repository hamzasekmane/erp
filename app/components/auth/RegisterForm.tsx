"use client";

import { useActionState, useEffect, useState } from "react";
import { registerAction } from "@/app/actions/registerAction";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Building2, User, Mail, Lock, Hash, Check, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const PLANS = [
  { id: "free", name: "Essai", price: "0€", desc: "7 jours" },
  { id: "starter", name: "Starter", price: "29€", desc: "Indépendant" },
  { id: "pro", name: "Pro", price: "79€", desc: "Business" },
];

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const planFromUrl = searchParams.get("plan");
    if (planFromUrl && PLANS.find((p) => p.id === planFromUrl)) {
      setSelectedPlan(planFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      toast.success("Bienvenue dans l'écosystème Velora !");
      setTimeout(() => router.push("/dashboard"), 2000);
    } else if (state?.message && !state?.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  const inputStyle = "w-full p-4 bg-zinc-900/40 border border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm font-medium text-white backdrop-blur-sm";
  const labelStyle = "text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within:text-blue-500 transition-colors";

  if (showSuccess) {
    return (
      <div className="w-full space-y-6 text-center py-12">
        <div className="flex justify-center">
          <div className="bg-blue-500/10 p-6 rounded-full border border-blue-500/20">
            <CheckCircle className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Initialisation...</h3>
          <p className="text-zinc-500 text-sm">Nous préparons votre environnement de gestion.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6 w-full group/form">
      <input type="hidden" name="planCode" value={selectedPlan} />

      {/* --- PLAN SELECTOR --- */}
      <div className="space-y-3">
        <label className={labelStyle}>Formule sélectionnée</label>
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`cursor-pointer relative p-3 rounded-2xl border transition-all duration-500 flex flex-col items-center ${
                selectedPlan === plan.id
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  : "border-white/5 bg-zinc-900/20 hover:border-white/10"
              }`}
            >
              <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedPlan === plan.id ? "text-blue-400" : "text-zinc-600"}`}>
                {plan.name}
              </span>
              <span className="text-sm font-black text-white">{plan.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- BUSINESS INFO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 group">
          <label className={labelStyle}><Building2 size={12} strokeWidth={3} /> Entreprise</label>
          <input name="businessName" type="text" className={inputStyle} placeholder="Nom" required />
        </div>
        <div className="space-y-2 group">
          <label className={labelStyle}><Hash size={12} strokeWidth={3} /> Fiscal (IFU)</label>
          <input name="taxNumber" type="text" className={inputStyle} placeholder="N° Fiscal" required />
        </div>
      </div>

      {/* --- USER INFO --- */}
      <div className="space-y-2 group">
        <label className={labelStyle}><User size={12} strokeWidth={3} /> Responsable</label>
        <input name="name" type="text" className={inputStyle} placeholder="Nom & Prénom" required />
      </div>

      <div className="space-y-2 group">
        <label className={labelStyle}><Mail size={12} strokeWidth={3} /> Email professionnel</label>
        <input name="email" type="email" className={inputStyle} placeholder="contact@velora.dz" required />
      </div>

      <div className="space-y-2 group">
        <label className={labelStyle}><Lock size={12} strokeWidth={3} /> Mot de passe sécurisé</label>
        <input name="password" type="password" className={inputStyle} placeholder="••••••••" required />
      </div>

      {/* --- SUBMIT --- */}
      <button
        type="submit"
        disabled={isPending}
        className={`relative w-full p-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all duration-500 flex justify-center items-center gap-3 mt-8 overflow-hidden group/btn ${
          isPending ? "bg-zinc-800 text-zinc-500" : "bg-white text-black hover:bg-blue-600 hover:text-white"
        }`}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isPending ? (
            <><Loader2 className="animate-spin h-4 w-4" /> Configuration...</>
          ) : (
            <>
              Créer mon espace
              <ArrowRight size={16} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
            </>
          )}
        </span>
      </button>
    </form>
  );
}