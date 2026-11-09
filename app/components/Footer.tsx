"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#020617] pt-24 pb-12 overflow-hidden">
      {/* تأثير الإضاءة الخلفي - لإنهاء الصفحة بجاذبية */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          
          {/* Brand & Newsletter Section (Occupies 5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <Link href="/" className="flex items-center font-black text-3xl tracking-tighter hover:opacity-80 transition-opacity">
              <span className="text-blue-500">V</span>
              <span className="text-white">e</span>
              <span className="text-blue-500">l</span>
              <span className="text-white">ora</span>
            </Link>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              Propulsez votre entreprise avec une gestion intelligente. Facturation, stocks et analyses réunis sur une seule plateforme.
            </p>
            
            {/* Newsletter Input */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest">Restez informé</h4>
              <div className="flex max-w-md bg-white/5 border border-white/10 p-1.5 rounded-2xl focus-within:border-blue-500/50 transition-all">
                <input 
                  type="email" 
                  placeholder="votre@email.com" 
                  className="bg-transparent border-none focus:ring-0 text-sm px-4 flex-grow text-white"
                />
                <button className="bg-white text-black text-xs font-black px-6 py-3 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                  S'ABONNER
                </button>
              </div>
            </div>
          </div>

          {/* Links Sections (Occupies 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-8">Produit</h3>
              <ul className="space-y-4">
                <FooterLink href="#features">Fonctionnalités</FooterLink>
                <FooterLink href="#pricing">Tarifs</FooterLink>
                <FooterLink href="#testimonials">Témoignages</FooterLink>
                <FooterLink href="#faq">Questions</FooterLink>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-8">Entreprise</h3>
              <ul className="space-y-4">
                <FooterLink href="/about">À propos</FooterLink>
                <FooterLink href="/blog">Blog</FooterLink>
                <FooterLink href="/contact">Contact</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-8">Légal</h3>
              <ul className="space-y-4">
                <FooterLink href="/privacy">Confidentialité</FooterLink>
                <FooterLink href="/terms">Conditions</FooterLink>
                <FooterLink href="/cookies">Cookies</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} Velora Technologies.
            </p>
            <div className="flex gap-6">
              <SocialIcon icon={<TwitterIcon />} href="#" />
              <SocialIcon icon={<GithubIcon />} href="#" />
              <SocialIcon icon={<LinkedInIcon />} href="#" />
            </div>
          </div>

          <div className="px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-full flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tighter">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// مكون فرعي للروابط لتقليل التكرار
const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link 
      href={href} 
      className="text-zinc-500 hover:text-blue-400 text-sm transition-all duration-300 flex items-center group"
    >
      <span className="w-0 group-hover:w-2 h-px bg-blue-500 mr-0 group-hover:mr-2 transition-all opacity-0 group-hover:opacity-100" />
      {children}
    </Link>
  </li>
);

// مكون أيقونات التواصل الاجتماعي
const SocialIcon = ({ icon, href }: { icon: React.ReactNode; href: string }) => (
  <a 
    href={href} 
    className="text-zinc-500 hover:text-white hover:scale-110 transition-all duration-300"
  >
    {icon}
  </a>
);

// الأيقونات (LinkedIn أضيف للمجموعة)
const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
);

// مكونات صغيرة للأيقونات لجعل الكود أنظف
const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
);

const GithubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
);