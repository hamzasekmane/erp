"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ticking = useRef(false);

  const navLinks = [
    { name: "Fonctionnalités", href: "#features" },
    { name: "Tarifs", href: "#pricing" },
    { name: "Témoignages", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
  ];

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20);
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const menuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
  };

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl transition-all duration-500 ${
        isScrolled ? "top-4" : "top-8"
      }`}
    >
      {/* GLASS CONTAINER */}
      <div
        className={`relative flex items-center justify-between px-6 py-3 rounded-full border backdrop-blur-xl transition-all duration-500 ${
          isScrolled
            ? "bg-white/70 border-gray-200 shadow-xl"
            : "bg-white/40 border-white/30"
        }`}
      >
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center font-black text-xl tracking-tight group"
        >
          <span className="text-blue-900 group-hover:rotate-12 transition">
            V
          </span>
          <span className="text-black">alora</span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em]">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative text-gray-600 hover:text-gray-900 transition"
            >
              {link.name}

              {/* underline animation */}
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-[12px] font-bold text-gray-600 hover:text-black uppercase tracking-widest"
          >
            Connexion
          </Link>

          <Link
            href="/register"
            className="relative px-6 py-2.5 text-[12px] font-black rounded-full bg-gray-900 text-white overflow-hidden group"
          >
            <span className="relative z-10">Démarrer</span>

            {/* hover glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition" />
          </Link>

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white/70 backdrop-blur"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-5 h-5 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeWidth="2.5" d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 right-0 mt-4 p-6 bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-[2rem] shadow-xl md:hidden"
          >
            <div className="flex flex-col gap-6 items-center">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold text-gray-700 hover:text-blue-600 transition uppercase"
                >
                  {link.name}
                </a>
              ))}

              <hr className="w-full border-gray-200" />

              <Link
                href="/login"
                className="text-black font-bold uppercase text-sm"
              >
                Connexion
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}