import { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Globe,
  Twitter,
  Linkedin,
  Github
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contacter le Support | Velora ERP",
  description: "Contactez notre équipe support pour toute assistance",
};

export default function ContactSupportPage() {
  return (
    <div className="min-h-screen">
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
                <Phone size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    VELORA • CONTACT
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Contacter le Support
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                  Nous sommes là pour vous aider
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 text-center hover:border-[var(--accent)]/50 transition-all">
            <div className="p-3 bg-blue-500/10 rounded-xl w-fit mx-auto mb-3">
              <Phone size={24} className="text-blue-500" />
            </div>
            <h3 className="font-black mb-1">Téléphone</h3>
            <p className="text-2xl font-black text-[var(--accent)] mb-2">+33 1 23 45 67 89</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Lun-Ven, 9h-18h</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 text-center hover:border-[var(--accent)]/50 transition-all">
            <div className="p-3 bg-purple-500/10 rounded-xl w-fit mx-auto mb-3">
              <Mail size={24} className="text-purple-500" />
            </div>
            <h3 className="font-black mb-1">Email</h3>
            <p className="text-sm font-medium mb-2">support@velora.com</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Réponse sous 24h</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 text-center hover:border-[var(--accent)]/50 transition-all">
            <div className="p-3 bg-green-500/10 rounded-xl w-fit mx-auto mb-3">
              <MessageCircle size={24} className="text-green-500" />
            </div>
            <h3 className="font-black mb-1">Chat en direct</h3>
            <p className="text-sm font-medium mb-2">Disponible 24/7</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Réponse instantanée</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 text-center hover:border-[var(--accent)]/50 transition-all">
            <div className="p-3 bg-amber-500/10 rounded-xl w-fit mx-auto mb-3">
              <Globe size={24} className="text-amber-500" />
            </div>
            <h3 className="font-black mb-1">Portail support</h3>
            <p className="text-sm font-medium mb-2">help.velora.com</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Base de connaissances</p>
          </div>
        </div>

        {/* Contact Form & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Form */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <Send size={18} className="text-[var(--accent)]" />
              </div>
              <h3 className="text-base font-black">Envoyez-nous un message</h3>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Sujet</label>
                <select className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors">
                  <option>Support technique</option>
                  <option>Facturation</option>
                  <option>Compte utilisateur</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <button type="submit" className="w-full px-6 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">
                Envoyer
              </button>
            </form>
          </div>

          {/* Office Info */}
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <MapPin size={18} className="text-red-500" />
                </div>
                <h3 className="text-base font-black">Notre adresse</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm">
                  123 Avenue des Champs-Élysées<br />
                  75008 Paris, France
                </p>
                <div className="pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-[var(--foreground-muted)]" />
                    <span className="text-xs font-medium">Horaires d'ouverture</span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Lundi - Vendredi: 9h00 - 18h00<br />
                    Samedi - Dimanche: Fermé
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
              <h3 className="text-base font-black mb-4">Suivez-nous</h3>
              <div className="flex gap-3">
                <Link href="#" className="p-3 bg-[var(--background)] rounded-xl hover:bg-[var(--accent)]/10 transition-colors">
                  <Twitter size={20} className="text-[var(--accent)]" />
                </Link>
                <Link href="#" className="p-3 bg-[var(--background)] rounded-xl hover:bg-[var(--accent)]/10 transition-colors">
                  <Linkedin size={20} className="text-[var(--accent)]" />
                </Link>
                <Link href="#" className="p-3 bg-[var(--background)] rounded-xl hover:bg-[var(--accent)]/10 transition-colors">
                  <Github size={20} className="text-[var(--accent)]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}