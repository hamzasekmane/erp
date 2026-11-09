const faqs = [
  { q: "Est-ce que je peux changer de plan plus tard ?", a: "Oui, vous pouvez passer d'un plan à un autre à tout moment depuis votre tableau de bord." },
  { q: "Y a-t-il des frais d'installation ?", a: "Non, aucun frais caché. Vous payez uniquement votre abonnement mensuel." },
  { q: "Mes données sont-elles exportables ?", a: "Bien sûr, vous pouvez exporter vos factures et clients en format CSV ou PDF." },
];

export default function FAQ() {
  return (
    <section className="py-24 bg-white/50 backdrop-blur-sm max-w-3xl mx-auto px-6 rounded-3xl" id="faq">
      <h2 className="text-center text-3xl font-black mb-16 tracking-tight text-gray-900">Questions Fréquentes</h2>
      <div className="space-y-4">
        {faqs.map((item, i) => (
          <details key={i} className="group border border-gray-200 rounded-2xl p-6 bg-white/80 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <summary className="font-bold text-gray-800 list-none flex justify-between items-center">
              {item.q}
              <span className="text-blue-600 transition-transform group-open:rotate-45 font-light text-2xl">+</span>
            </summary>
            <p className="mt-4 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}