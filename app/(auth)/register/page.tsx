"use client";

import { Suspense } from "react";
import RegisterForm from "@/app/components/auth/RegisterForm";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Globe, Lock, CheckCircle2, Star, Zap } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#01050d] flex flex-col lg:flex-row font-sans selection:bg-blue-500/30 text-white" dir="ltr">
      
      {/* --- LEFT SIDE: VALUE PROP --- */}
      <div className="hidden lg:flex lg:w-1/2 p-16 flex-col justify-between relative overflow-hidden border-r border-white/5 bg-[radial-gradient(circle_at_bottom_left,#0a0f1d,transparent)]">
        
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
 <Link
          href="/"
          className="flex items-center font-black text-2xl tracking-tight group"
        >
          <span className="text-blue-900 group-hover:rotate-12 transition">
            V
          </span>
          <span className="text-white">alora</span>
        </Link>
          </div>

          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black leading-[0.95] mb-10 tracking-tighter uppercase italic"
          >
            Propulsez votre <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-rose-500">
              business.
            </span>
          </motion.h2>

          <div className="space-y-10 mt-16">
            {[
              { title: "Facturation Illimitée", desc: "Émettez vos documents sans aucune restriction.", icon: <Zap size={20}/> },
              { title: "Intelligence Fiscale", desc: "Conformité automatisée (DZD/IFU) intégrée.", icon: <ShieldCheck size={20}/> },
              { title: "Gestion 360°", desc: "Stocks, clients et trésorerie centralisés.", icon: <CheckCircle2 size={20}/> },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start group"
              >
                <div className="mt-1 bg-white/5 border border-white/10 p-3 rounded-2xl group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all duration-500">
                  <div className="text-blue-500">{feature.icon}</div>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-white mb-1">{feature.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-xs font-medium">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl"
        >
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#3b82f6" className="text-blue-500" />)}
          </div>
          <p className="text-zinc-300 text-lg leading-relaxed italic font-medium tracking-tight">
            "Une interface d'une clarté redoutable. Velora a réduit nos temps de gestion de 40% dès le premier mois."
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-lg">HS</div>
            <div>
              <p className="font-black text-sm uppercase italic">Hamza Sekmane</p>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.3em] mt-0.5">CEO @ Sekmane Solutions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-[#01050d]">
        <div className="max-w-[540px] w-full relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase italic">Prêt à démarrer ?</h1>
            <p className="text-zinc-500 text-sm font-medium tracking-wide">Inscrivez votre entreprise et accédez à votre infrastructure.</p>
          </div>

          <div className="bg-[#0a0f1d]/60 border border-white/5 p-8 lg:p-10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-rose-600/10 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
             <div className="relative">
                <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" />}>
                  <RegisterForm />
                </Suspense>
             </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">
              Déjà membre ? <Link href="/login" className="text-blue-500 hover:text-white transition-colors ml-2 underline underline-offset-4 decoration-blue-500/30">Se connecter</Link>
            </p>
            
            <div className="flex justify-between items-center mt-12 px-6 pt-10 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
              {[{ icon: <Lock size={18}/>, label: "AES-256" }, { icon: <Globe size={18}/>, label: "RAILWAY" }, { icon: <ShieldCheck size={18}/>, label: "GDPR" }].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group">
                  <div className="text-zinc-500 group-hover:text-blue-500 transition-colors">{b.icon}</div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}