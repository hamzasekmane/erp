"use client";

import LoginForm from "@/app/components/auth/LoginForm";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Globe,
  Lock,
  CheckCircle2,
  Star,
  ArrowRight,
  Zap
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#01050d] flex flex-col lg:flex-row font-sans selection:bg-blue-500/30 text-white" dir="ltr">
      
      {/* --- LEFT SIDE: VALUE PROPOSITION (MIDNIGHT VERSION) --- */}
      <div className="hidden lg:flex lg:w-1/2 p-16 flex-col justify-between relative overflow-hidden border-r border-white/5 bg-[radial-gradient(circle_at_top_right,#0a0f1d,transparent)]">
        
        {/* Glows de fond */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-rose-600/5 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
 <Link
          href="/"
          className="flex items-center font-black text-2xl tracking-tight group"
        >
          <span className="text-blue-900 group-hover:rotate-12 transition">
            V
          </span>
          <span className="text-wihte">alora</span>
        </Link>
          </div>

          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-7xl font-black leading-[0.9] mb-10 tracking-tighter uppercase italic"
          >
            Gérez votre <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-rose-500">
              succès.
            </span>
          </motion.h2>

          <div className="space-y-10 mt-20">
            {[
              { title: "Accès Sécurisé", desc: "Protection AES-256 de bout en bout.", icon: <Lock size={20}/> },
              { title: "Performance Live", desc: "Visualisez vos métriques en temps réel.", icon: <Zap size={20}/> },
              { title: "Écosystème SaaS", desc: "Multi-tenant et prêt pour l'échelle.", icon: <Globe size={20}/> },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start group"
              >
                <div className="mt-1 bg-white/5 border border-white/10 p-3 rounded-2xl group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all duration-500">
                  <CheckCircle2 size={20} className="text-blue-500" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-white mb-1">{feature.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-xs font-medium">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonial Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/[0.03] border border-white/5 p-8 rounded-[3rem] backdrop-blur-xl"
        >
          <div className="flex gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill="#3b82f6" className="text-blue-500" />
            ))}
          </div>
          <p className="text-zinc-300 text-lg leading-relaxed italic font-medium tracking-tight">
            "Simple, rapide et redoutable. Velora est l'outil central de notre transformation digitale."
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-xl">
              HS
            </div>
            <div>
              <p className="font-black text-sm uppercase italic tracking-wider">Hamza Sekmane</p>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.3em] mt-0.5">
                CEO @ Sekmane Solutions
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- RIGHT SIDE: THE FORM (MIDNIGHT VERSION) --- */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-24 relative bg-[#01050d]">
        
        {/* Subtile Glow derrière le formulaire */}
        <div className="absolute w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-[420px] w-full relative z-10">
          
          <div className="mb-8 sm:mb-12 text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic"
            >
              Bon retour !
            </motion.h1>
            <p className="text-zinc-500 text-sm font-medium tracking-wide">
              Identifiez-vous pour accéder à l'infrastructure de gestion.
            </p>
          </div>

          {/* Form Container */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-rose-600/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative bg-[#0a0f1d]/80 border border-white/5 p-5 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] backdrop-blur-2xl shadow-2xl">
              <LoginForm />
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">
              Pas encore membre ?{" "}
              <Link href="/register" className="text-blue-500 hover:text-white transition-colors ml-2 underline underline-offset-4 decoration-blue-500/30">
                Créer un compte
              </Link>
            </p>

            {/* Trust Badges */}
            <div className="flex justify-between items-center mt-12 px-6 pt-10 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity duration-500">
              {[
                { icon: <Lock size={18} />, label: "AES-256" },
                { icon: <Globe size={18} />, label: "Railway" },
                { icon: <ShieldCheck size={18} />, label: "GDPR" }
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group cursor-help">
                  <div className="text-zinc-500 group-hover:text-blue-500 transition-colors">
                    {badge.icon}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}