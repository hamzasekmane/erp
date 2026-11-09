"use client";

import { Package, AlertTriangle, BarChart3, RefreshCcw } from "lucide-react";

export default function StockPage() {
  return (
    <main className="min-h-screen bg-[#0b0f19] text-white p-10">
      <h1 className="text-4xl font-black mb-10">GESTION DE STOCK</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: <Package />, title: "Produits", desc: "Liste complète des produits." },
          { icon: <AlertTriangle />, title: "Alertes", desc: "Stock critique en temps réel." },
          { icon: <BarChart3 />, title: "Analyse", desc: "Performance du stock." },
          { icon: <RefreshCcw />, title: "Mouvements", desc: "Entrées / sorties." },
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-2xl">
            <div className="mb-4 text-rose-500">{item.icon}</div>
            <h3 className="font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}