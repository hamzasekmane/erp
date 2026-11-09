"use client";

import { BarChart3, Shield, Zap, Users, Globe, Smartphone } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBusinessTime,
  faMoneyBillTransfer,
  faBox,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analyses Avancées",
    desc: "Suivez vos indicateurs clés, anticipez les tendances avec des prévisions IA et exportez vos rapports en un clic.",
    size: "md:col-span-2", // Carte large
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Sécurité Totale",
    desc: "Cryptage de bout en bout et authentification 2FA pour protéger vos actifs.",
    size: "md:col-span-1",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Multi-Équipes",
    desc: "Collaborez en temps réel et gérez les accès de vos collaborateurs facilement.",
    size: "md:col-span-1",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Haute Performance",
    desc: "Une interface optimisée sans aucune latence pour une productivité maximale.",
    size: "md:col-span-2", // Carte large
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Cloud Algérie",
    desc: "Accédez à vos données partout, synchronisées instantanément sur tous vos supports.",
    size: "md:col-span-1",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "App Responsive",
    desc: "Une expérience fluide sur mobile pour gérer votre business lors de vos déplacements.",
    size: "md:col-span-1",
  },
];

const saasServices = [
  {
    title: "Facturation",
    description: "Système de facturation automatisé aux normes DZD.",
    icon: <FontAwesomeIcon icon={faMoneyBillTransfer} />,
    link: "/facturation",
    procedures: "Découvrir",
    gradient: "from-blue-600 via-blue-700 to-indigo-800",
  },
  {
    title: "Stock",
    description: "Suivi inventaire en temps réel et alertes ruptures.",
    icon: <FontAwesomeIcon icon={faBox} />,
    link: "/stock",
    procedures: "Gérer",
    gradient: "from-cyan-500 via-blue-600 to-blue-700",
  },
  {
    title: "Croissance",
    description: "Des outils analytics pour booster votre chiffre d'affaires.",
    icon: <FontAwesomeIcon icon={faBusinessTime} />,
    link: "/croissance",
    procedures: "Analyser",
    gradient: "from-indigo-600 via-purple-700 to-violet-800",
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden py-9 bg-white" id="features">
      {/* Background Blobs subtils */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* EN-TÊTE */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full mb-8 shadow-sm"
          >
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Ecosystem v2.0</span>
          </motion.div>
<h2 className="md:text-4xl font-black tracking-tighter leading-none mb-9 text-gray-900">
  L'ÉCOSYSTÈME{" "}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-[#f43f5e] italic py-1">
    COMPLET
  </span>
</h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium">
            Une suite d'outils interconnectés pour propulser votre entreprise vers la nouvelle ère digitale.
          </p>
        </div>

        {/* CARTES SERVICES (BENTO HAUTE COULEUR) */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {saasServices.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className={`group relative overflow-hidden rounded-[3rem] bg-gradient-to-br ${s.gradient} p-10 shadow-2xl transition-all`}
            >
              <div className="relative z-20 text-white h-full flex flex-col justify-between">
                <div>
                  <div className="mb-6 text-white/90 text-4xl group-hover:scale-110 transition-transform duration-500">{s.icon}</div>
                  <h3 className="text-3xl font-black mb-3 tracking-tighter uppercase italic italic">
                    {s.title}
                  </h3>
                  <p className="text-white/80 font-medium mb-12 max-w-[200px]">{s.description}</p>
                </div>
                <Link
                  href={s.link}
                  className="w-fit inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-white text-blue-900 px-7 py-3 rounded-full hover:bg-gray-100 transition shadow-lg shadow-black/20"
                >
                  {s.procedures}
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
              {/* Effet de brillance fond de carte */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-50" />
            </motion.div>
          ))}
        </div>

        {/* FEATURES BENTO GRID (DESIGN APPLE-LIKE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileInView={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0.95 }}
              viewport={{ once: true }}
              className={`p-10 bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group ${f.size}`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-6 text-blue-600 bg-blue-50 w-14 h-14 flex items-center justify-center rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  {f.icon}
                </div>
                <h4 className="font-black text-xl mb-4 tracking-tight text-gray-900 uppercase italic">
                  {f.title}
                </h4>
                <p className="text-gray-500 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA FINAL & LOGOS */}
        <div className="mt-32 mb-12">
          <div className="bg-[#121826] rounded-[4rem] p-12 lg:p-20 relative overflow-hidden text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-8">
                PRÊT À RÉVOLUTIONNER <br /> VOTRE GESTION ?
              </h3>
              <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto font-medium">
                Démarrez votre essai gratuit de 14 jours sans engagement et découvrez la puissance de Velora.
              </p>
              <Link
                href="/register"
                className="inline-block px-12 py-6 bg-white text-gray-950 rounded-full font-black uppercase text-sm tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl"
              >
                Commencer l'aventure
              </Link>
            </div>
          </div>

          {/* Logos Trust Section */}
{/* Logos Trust Section */}
<div className="mt-15">
  <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-12">
    PROPULSÉ PAR LES MEILLEURES TECHNOLOGIES
  </p>
  <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-30 grayscale hover:opacity-100 transition-all duration-700 ease-in-out">
    {/* Next.js */}
    <svg className="h-6 md:h-8 fill-current text-gray-400" viewBox="0 0 128 128">
      <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64c18.5 0 35.1-7.9 46.7-20.5l-51.5-66.2v46h-8.8V42.5h8.8l46.2 59.4C119.5 91.5 128 78.7 128 64c0-35.3-28.7-64-64-64zm15.4 42.5h8.8v43h-8.8v-43z" />
    </svg>

    {/* Tailwind CSS */}
    <svg className="h-6 md:h-8 fill-current text-gray-400" viewBox="0 0 24 24">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.666 17.818 9.027 19 12.001 19c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
    </svg>

    {/* Framer Motion (representé par Framer) */}
    <svg className="h-6 md:h-8 fill-current text-gray-400" viewBox="0 0 24 24">
      <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
    </svg>

    {/* React */}
    <svg className="h-7 md:h-9 fill-current text-gray-400" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="8" />
      <path d="M50 30c-15.5 0-28 1.8-28 4s12.5 4 28 4 28-1.8 28-4-12.5-4-28-4zm0 32c-15.5 0-28 1.8-28 4s12.5 4 28 4 28-1.8 28-4-12.5-4-28-4zm0-16c-15.5 0-28 1.8-28 4s12.5 4 28 4 28-1.8 28-4-12.5-4-28-4z" transform="rotate(60 50 50)" />
      <path d="M50 30c-15.5 0-28 1.8-28 4s12.5 4 28 4 28-1.8 28-4-12.5-4-28-4zm0 32c-15.5 0-28 1.8-28 4s12.5 4 28 4 28-1.8 28-4-12.5-4-28-4zm0-16c-15.5 0-28 1.8-28 4s12.5 4 28 4 28-1.8 28-4-12.5-4-28-4z" transform="rotate(-60 50 50)" />
    </svg>
    
    {/* Vercel */}
    <svg className="h-5 md:h-7 fill-current text-gray-400" viewBox="0 0 512 512">
      <path d="M256 48l240 416H16z" />
    </svg>
  </div>
</div>
        </div>
      </div>
    </section>
  );
}