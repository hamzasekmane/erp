"use client";

import { TrendingUp, Users, Globe, Zap } from "lucide-react";

export default function CroissancePage() {
  return (
    <main className="min-h-screen bg-[#0b0f19] text-white p-10">
      <h1 className="text-4xl font-black mb-10">CROISSANCE BUSINESS</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: <TrendingUp />, title: "KPI", desc: "Suivi des performances." },
          { icon: <Users />, title: "Clients", desc: "Analyse comportement client." },
          { icon: <Globe />, title: "Marché", desc: "Expansion & insights." },
          { icon: <Zap />, title: "Optimisation", desc: "Automatisation intelligente." },
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-2xl">
            <div className="mb-4 text-green-500">{item.icon}</div>
            <h3 className="font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}