"use client";

import { useActionState, useEffect } from "react";
import { requestPasswordResetAction } from "@/app/actions/settingsActions";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, ShieldCheck, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  // Utilisation de useActionState comme sur ton LoginForm
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, { success: false, message: "" });

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[440px] w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0f1d]/60 border border-white/5 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] backdrop-blur-2xl shadow-2xl"
        >
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors mb-10 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
            Retour
          </Link>

          <AnimatePresence mode="wait">
            {!state.success ? (
              <motion.div key="form-reset" exit={{ opacity: 0, x: 20 }}>
                <div className="mb-10">
                  <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic leading-none">
                    Accès <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Perdu ?</span>
                  </h1>
                  <p className="text-zinc-500 text-sm font-medium">
                    Entrez votre email pour recevoir un accès sécurisé.
                  </p>
                </div>

                {/* Utilisation de formAction ici */}
                <form action={formAction} className="space-y-6">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 ml-1">
                      <Mail size={12} strokeWidth={3} /> Adresse e-mail
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="nom@entreprise.com"
                      className="w-full p-4 bg-zinc-900/40 border border-white/5 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all text-sm text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="group relative w-full p-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all bg-white text-black overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors">
                      {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Envoyer le lien"}
                    </span>
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success-reset" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ShieldCheck className="text-cyan-500" size={40} />
                </div>
                <h2 className="text-2xl font-black text-white mb-4 uppercase italic">Vérifiez vos mails</h2>
                <p className="text-zinc-500 text-sm mb-10">Un lien de récupération a été envoyé à votre adresse.</p>
                <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 hover:text-white">
                  Retour à la connexion
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}