"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  faBusinessTime,
  faMoneyBillTransfer,
  faBox,
  faChevronRight,
  faPause,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  const dashboardSlides = useMemo(
    () => [
      {
        id: "sales",
        title: "CHIFFRE D'AFFAIRES",
        value: "2,45 M DA",
        subtext: "+23% vs mois dernier",
        accent: "bg-blue-500",
        icon: faBusinessTime,
      },
      {
        id: "recovery",
        title: "RECOUVREMENT",
        value: "87%",
        subtext: "312k DA restant",
        accent: "bg-indigo-500",
        icon: faMoneyBillTransfer,
      },
      {
        id: "stock",
        title: "STOCK CRITIQUE",
        value: "3 Alertes",
        subtext: "Réapprovisionnement nécessaire",
        accent: "bg-rose-500",
        icon: faBox,
      },
    ],
    []
  );

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % dashboardSlides.length);
  }, [dashboardSlides.length]);

  useEffect(() => {
    if (prefersReducedMotion || !isAutoPlaying) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide, prefersReducedMotion, isAutoPlaying]);

  return (
    <main className="relative min-h-screen flex items-center max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 overflow-visible">
      {/* Background Blobs décoratifs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
        
        {/* GAUCHE : TEXTE & CTA */}
{/* SECTION GAUCHE ENVELOPPÉE DANS UN STYLE BENTO */}
        <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-10 lg:p-16 flex flex-col justify-center shadow-sm">

          <h1 className="text-4xl sm:text-5xl md:text-[5rem] font-black tracking-tighter text-gray-900 leading-[0.9] mb-6 sm:mb-8">
            GÉREZ VOTRE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-[#f43f5e]">
              BUSINESS
            </span> <br />
            SANS LIMITES.
          </h1>

          <p className="text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg mb-8 sm:mb-10 font-medium italic">
            La plateforme tout-en-un pour la facturation, le stock et la croissance de votre entreprise en Algérie.
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <Link
              href="/register"
              className="px-6 sm:px-10 py-4 sm:py-5 bg-[#121826] text-white rounded-2xl sm:rounded-[2rem] font-black uppercase text-xs sm:text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-900/20"
            >
              Essai Gratuit
            </Link>
            <button className="px-4 sm:px-8 py-4 sm:py-5 text-gray-900 font-bold text-base sm:text-lg rounded-2xl sm:rounded-[2rem] hover:bg-white transition-all group flex items-center gap-2">
              Voir Démo 
              <FontAwesomeIcon icon={faChevronRight} className="text-xs group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* DROITE : BENTO GRID AVEC CAROUSEL INTÉGRÉ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 gap-4 sm:h-[550px] w-full relative perspective-[1200px]">
          
          {/* CARTE PRINCIPALE (ROUGE) : CAROUSEL 3D */}
          <motion.div
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            className="col-span-1 sm:col-span-2 sm:row-span-2 relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-10 min-h-[380px] sm:min-h-0 shadow-2xl flex flex-col justify-between group"
          >
            <div className="relative z-20">
              <h2 className="text-white text-4xl font-black leading-none tracking-tighter uppercase italic">
                VELORA X <br /> <span className="text-2xl opacity-90 italic">DASHBOARD</span>
              </h2>
              <div className="flex gap-2 mt-4">
                {dashboardSlides.map((_, idx) => (
                  <div key={idx} className={`h-1 rounded-full transition-all ${idx === current ? "w-6 bg-white" : "w-2 bg-white/30"}`} />
                ))}
              </div>
            </div>

            {/* ANIMATION DU CAROUSEL (Contenu Zinc) */}
            <div className="relative z-20 h-48 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 20, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -20, rotateX: 15 }}
                  transition={{ duration: 0.5 }}
                  className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-white rounded-[2.5rem] p-8 shadow-2xl"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {dashboardSlides[current].title}
                      </p>
                      <h3 className="text-3xl font-black italic">{dashboardSlides[current].value}</h3>
                    </div>
                    <div className={`w-12 h-12 ${dashboardSlides[current].accent} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <FontAwesomeIcon icon={dashboardSlides[current].icon} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 font-bold">{dashboardSlides[current].subtext}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Boutons de contrôle overlay */}
            <div className="absolute bottom-6 left-10 z-30 flex items-center gap-4">
               <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-[10px]">
                  <FontAwesomeIcon icon={isAutoPlaying ? faPause : faPlay} />
               </button>
            </div>
          </motion.div>

          {/* CARTE FINANCE (VERTE) */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="col-span-1 row-span-1 relative overflow-hidden rounded-[2rem] sm:rounded-[2.8rem] bg-[#1a4d2e] min-h-[150px] sm:min-h-0 group shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-900 opacity-80" />
            <div className="absolute bottom-8 left-8 z-10">
              <p className="text-white font-black text-sm uppercase tracking-tight">Finance</p>
              <span className="text-[10px] text-white/60 font-bold italic tracking-widest">PRO MODULE</span>
            </div>
            <FontAwesomeIcon icon={faMoneyBillTransfer} className="absolute -top-4 -right-4 text-white/10 text-8xl" />
          </motion.div>

          {/* MINI GRID (STOCK & LIVE) */}
          <div className="col-span-1 row-span-1 grid grid-cols-2 gap-4 min-h-[120px] sm:min-h-0">
             <div className="rounded-[2.2rem] bg-[#1c1c1e] flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faBox} className="text-orange-500 text-2xl" />
             </div>
             <div className="rounded-[2.2rem] bg-white border border-gray-100 flex flex-col items-center justify-center shadow-md">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse mb-1" />
                <span className="text-[8px] font-black text-gray-400 uppercase">Live</span>
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}