"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const hoverAnimation = prefersReducedMotion ? {} : { y: -6, transition: { duration: 0.2 } };

  const plans = useMemo(() => [
    {
      name: "Starter",
      code: "starter",
      price: { monthly: 2900, yearly: 2400 },
      description: "Tout ce dont vous avez besoin pour débuter la digitalisation.",
      features: { users: 3, storage: 500, invoices: 100, clients: 50, hasReports: true, hasApiAccess: false, hasCustomBranding: false },
      isPopular: false,
    },
    {
      name: "Scale",
      code: "scale",
      price: { monthly: 7900, yearly: 6500 },
      description: "La flexibilité totale pour les entreprises en pleine croissance.",
      features: { users: 10, storage: 2048, invoices: 1000, clients: 500, hasReports: true, hasApiAccess: true, hasCustomBranding: true },
      isPopular: true,
    },
    {
      name: "Growth",
      code: "growth",
      price: { monthly: 15000, yearly: 12500 },
      description: "Le summum de la puissance pour les grandes structures.",
      features: { users: 99, storage: 10240, invoices: 9999, clients: 9999, hasReports: true, hasApiAccess: true, hasCustomBranding: true },
      isPopular: false,
    },
  ], []);

  const handlePlanSelection = async (planCode: string) => {
    setIsNavigating(true);
    router.push(`/register?plan=${planCode}`);
  };

  const comparisonSections = [
    {
      title: "Utilisation & Quotas",
      items: [
        { name: "Utilisateurs", key: "users", suffix: "" },
        { name: "Stockage", key: "storage", suffix: " Mo" },
        { name: "Factures/mois", key: "invoices", suffix: "" },
        { name: "Clients", key: "clients", suffix: "" },
      ],
    },
    {
      title: "Fonctionnalités",
      items: [
        { name: "Rapports", key: "hasReports", isBoolean: true },
        { name: "API", key: "hasApiAccess", isBoolean: true },
        { name: "Branding", key: "hasCustomBranding", isBoolean: true },
      ],
    },
  ];

  return (
    <section className="relative py-16 bg-[#01050d] text-white overflow-hidden rounded-t-[3rem] border-t border-white/10">
      
      {/* Minimal background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/10 via-cyan-500/5 to-transparent blur-[100px] rounded-full" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        
        {/* Header compact */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase leading-[1.1]"
          >
            .Tarifs <span>.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-blue-500/50">
              Valora .
            </span>
          </motion.h2>

          <div className="inline-flex p-1 bg-[#121216]/80 border border-white/5 rounded-xl shadow-lg backdrop-blur-sm">
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
                  billing === cycle ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-gray-500 hover:text-white"
                }`}
              >
                {cycle === "monthly" ? "Mensuel" : "Annuel (-20%)"}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid - compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20 items-stretch">
          {plans.map((plan) => (
            <motion.div
              key={plan.code}
              whileHover={hoverAnimation}
              className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                plan.isPopular 
                  ? "bg-[#0a0f1d] border-blue-500/40 shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)] z-10 scale-[1.02]" 
                  : "bg-white/[0.02] border-white/5 backdrop-blur-sm hover:border-white/10"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[8px] font-black px-4 py-1 rounded-full tracking-[0.15em] uppercase shadow-md">
                  Plus Populaire
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-base font-black italic uppercase mb-2 tracking-tight ${plan.isPopular ? "text-blue-400" : "text-gray-500"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={billing}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-5xl font-black italic tracking-tighter"
                    >
                      {billing === "monthly" ? plan.price.monthly : plan.price.yearly}
                    </motion.span>
                  </AnimatePresence>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 leading-none">DZD</span>
                    <span className="text-[8px] text-gray-600 uppercase font-black tracking-wider">/mois</span>
                  </div>
                </div>
                <p className="mt-3 text-gray-500 text-xs font-medium leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <button 
                onClick={() => handlePlanSelection(plan.code)}
                disabled={isNavigating}
                className={`group relative w-full py-3 rounded-xl font-black uppercase text-[9px] tracking-[0.15em] transition-all overflow-hidden ${
                  plan.isPopular ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-1">
                  {isNavigating ? "Chargement..." : "Choisir"} <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              <ul className="mt-6 pt-6 border-t border-white/5 space-y-2">
                {Object.entries(plan.features).slice(0, 4).map(([key, val], idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div className={`p-0.5 rounded-full ${plan.isPopular ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      {typeof val === "number" ? `${val === 9999 ? "∞" : val} ${key}` : key}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Comparison table - compact */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-4 mb-6 px-4 items-center">
            <div className="text-lg font-black italic uppercase text-blue-500 tracking-tighter">Comparatif</div>
            {plans.map(p => (
              <div key={p.code} className="text-center text-[9px] font-black uppercase tracking-wider text-gray-500">{p.name}</div>
            ))}
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg">
            {comparisonSections.map((section, sIdx) => (
              <div key={sIdx}>
                <div className="px-6 py-3 bg-white/[0.03] text-[8px] font-black uppercase tracking-[0.3em] text-blue-400/70 border-b border-white/5">
                  {section.title}
                </div>
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="grid grid-cols-4 gap-4 px-6 py-3 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors group">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-300">{item.name}</div>
                    {plans.map(plan => {
                      const val = plan.features[item.key as keyof typeof plan.features];
                      return (
                        <div key={plan.code} className="flex justify-center">
                          {'isBoolean' in item ? (
                            val ? <Check size={14} strokeWidth={3} className="text-blue-400" /> : <span className="text-gray-700 font-black text-xs">✕</span>
                          ) : (
                            <span className={`text-xs font-black italic ${plan.isPopular ? "text-white" : "text-gray-400"}`}>
                              {val === 9999 ? "∞" : `${val}${item.suffix || ""}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}