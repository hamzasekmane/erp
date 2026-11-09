"use client";
import { useActionState, useEffect } from "react";
import { loginAction } from "@/app/actions/loginAction";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const initialState = { success: false, message: "", errors: {} };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success("Authentification réussie. Bienvenue sur Velora.");
      router.push("/dashboard");
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      action={formAction} 
      className="space-y-6 w-full"
    >
      {/* CHAMP EMAIL */}
      <div className="space-y-2 group">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 ml-1 group-focus-within:text-blue-500 transition-colors">
          <Mail size={12} strokeWidth={3} /> Adresse e-mail
        </label>
        <div className="relative">
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nom@entreprise.com"
            className="w-full p-4 bg-zinc-900/40 border border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm font-medium text-white backdrop-blur-sm"
            required
          />
        </div>
        {state?.errors?.email && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-[10px] mt-1 ml-1 font-black uppercase tracking-wider">
            {state.errors.email[0]}
          </motion.p>
        )}
      </div>

      {/* CHAMP MOT DE PASSE */}
      <div className="space-y-2 group">
        <div className="flex justify-between items-center ml-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 group-focus-within:text-blue-500 transition-colors">
            <Lock size={12} strokeWidth={3} /> Mot de passe
          </label>
          <Link
            href="/forgot-password"
            className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-blue-400 transition-colors"
          >
            Oublié ?
          </Link>
        </div>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full p-4 bg-zinc-900/40 border border-white/5 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-zinc-700 text-sm font-medium text-white backdrop-blur-sm"
          required
        />
      </div>

      {/* BOUTON D'ACTION */}
      <button
        type="submit"
        disabled={isPending}
        className={`relative w-full p-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all duration-500 flex justify-center items-center gap-3 mt-8 overflow-hidden group ${
          isPending 
          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
          : "bg-white text-black hover:bg-blue-600 hover:text-white"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <span className="relative z-10 flex items-center gap-2">
          {isPending ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Initialisation...
            </>
          ) : (
            <>
              Accéder au Dashboard
              <ArrowRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </span>
      </button>

      {/* FOOTER SÉCURITÉ */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 border border-white/5 rounded-full">
           <ShieldCheck size={10} className="text-emerald-500" />
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
             Infrastructure Sécurisée Velora
           </span>
        </div>
        
        <p className="text-[9px] text-center text-zinc-600 leading-relaxed uppercase tracking-tighter max-w-[280px]">
          Chiffrement <span className="text-zinc-400 font-bold">AES-256 bits</span> actif. 
          Session protégée contre les attaques par force brute.
        </p>
      </div>
    </motion.form>
  );
}