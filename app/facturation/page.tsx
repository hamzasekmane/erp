"use client";

import { FileText, Send, CreditCard, BarChart3 } from "lucide-react";

export default function FacturationPage() {
  return (
    <main className="min-h-screen bg-[#0b0f19] text-white p-10">
      <h1 className="text-4xl font-black mb-10">FACTURATION</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: <FileText />, title: "Créer facture", desc: "Générer une facture rapidement." },
          { icon: <Send />, title: "Envoyer", desc: "Envoyer automatiquement par email." },
          { icon: <CreditCard />, title: "Paiements", desc: "Suivi des paiements." },
          { icon: <BarChart3 />, title: "Rapports", desc: "Analyse financière complète." },
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-2xl">
            <div className="mb-4 text-blue-500">{item.icon}</div>
            <h3 className="font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}