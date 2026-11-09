import { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ChevronRight,
  FileText,
  Video,
  Bookmark,
  ArrowRight,
  GraduationCap,
  Code,
  Settings,
  Users,
  CreditCard,
  Shield,
  Bell,
  Building2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation | Velora ERP",
  description: "Guides, tutoriels et documentation pour utiliser Velora ERP",
};

interface DocCategory {
  title: string;
  icon: React.ElementType;
  articles: { title: string; href: string; duration: string }[];
  color: string;
}

export default function DocumentationPage() {
  const categories: DocCategory[] = [
    {
      title: "Premiers pas",
      icon: GraduationCap,
      color: "from-blue-500/20 to-blue-500/5",
      articles: [
        { title: "Bienvenue sur Velora ERP", href: "#", duration: "5 min" },
        { title: "Configuration initiale", href: "#", duration: "10 min" },
        { title: "Gestion de votre profil", href: "#", duration: "3 min" },
      ]
    },
    {
      title: "Paramètres",
      icon: Settings,
      color: "from-purple-500/20 to-purple-500/5",
      articles: [
        { title: "Configuration de l'entreprise", href: "#", duration: "8 min" },
        { title: "Gestion des utilisateurs", href: "#", duration: "12 min" },
        { title: "Paramètres de sécurité", href: "#", duration: "6 min" },
      ]
    },
    {
      title: "Facturation",
      icon: CreditCard,
      color: "from-emerald-500/20 to-emerald-500/5",
      articles: [
        { title: "Créer une facture", href: "#", duration: "7 min" },
        { title: "Méthodes de paiement", href: "#", duration: "5 min" },
        { title: "Abonnements", href: "#", duration: "10 min" },
      ]
    },
    {
      title: "Utilisateurs & Rôles",
      icon: Users,
      color: "from-cyan-500/20 to-cyan-500/5",
      articles: [
        { title: "Ajouter des utilisateurs", href: "#", duration: "4 min" },
        { title: "Gérer les permissions", href: "#", duration: "8 min" },
        { title: "Rôles personnalisés", href: "#", duration: "6 min" },
      ]
    },
    {
      title: "Sécurité",
      icon: Shield,
      color: "from-rose-500/20 to-rose-500/5",
      articles: [
        { title: "Authentification 2FA", href: "#", duration: "5 min" },
        { title: "Gestion des sessions", href: "#", duration: "3 min" },
        { title: "Logs d'activité", href: "#", duration: "4 min" },
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      color: "from-amber-500/20 to-amber-500/5",
      articles: [
        { title: "Configurer les alertes", href: "#", duration: "4 min" },
        { title: "Emails automatiques", href: "#", duration: "6 min" },
        { title: "Notifications push", href: "#", duration: "3 min" },
      ]
    },
  ];

  const popularArticles = [
    { title: "Comment configurer mon entreprise ?", reads: "2.3k", icon: Building2 },
    { title: "Guide des méthodes de paiement", reads: "1.8k", icon: CreditCard },
    { title: "Gestion des utilisateurs et rôles", reads: "1.5k", icon: Users },
    { title: "Sécuriser mon compte avec 2FA", reads: "1.2k", icon: Shield },
  ];

  return (
    <div className="min-h-screen">
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
                <BookOpen size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    VELORA • DOCS
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Documentation
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                  Guides, tutoriels et ressources pour maîtriser Velora ERP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un article, un guide ou un tutoriel..."
            className="w-full pl-11 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.title}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/50 transition-all duration-300"
              >
                <div className={`p-4 bg-gradient-to-r ${category.color} border-b border-[var(--border)]`}>
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-[var(--accent)]" />
                    <h3 className="font-black text-[var(--foreground)]">{category.title}</h3>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {category.articles.map((article) => (
                    <Link
                      key={article.title}
                      href={article.href}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)]/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[var(--foreground-muted)]" />
                        <span className="text-sm">{article.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--foreground-muted)]">{article.duration}</span>
                        <ChevronRight size={14} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Popular Articles */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Bookmark size={18} className="text-amber-500" />
            </div>
            <h3 className="text-base font-black">Articles populaires</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularArticles.map((article, idx) => {
              const ArticleIcon = article.icon;
              return (
                <Link
                  key={idx}
                  href="#"
                  className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all group"
                >
                  <ArticleIcon size={20} className="text-[var(--accent)] mb-2" />
                  <p className="text-sm font-medium text-[var(--foreground)] mb-1">{article.title}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">{article.reads} lectures</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Video Tutorials */}
        <div className="bg-gradient-to-r from-[var(--accent)]/10 to-transparent rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Video size={18} className="text-red-500" />
            </div>
            <h3 className="text-base font-black">Tutoriels vidéo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl overflow-hidden bg-[var(--card-bg)] border border-[var(--border)]">
              <div className="aspect-video bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center">
                <Video size={32} className="text-[var(--accent)]" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">Prise en main de Velora</p>
                <p className="text-[10px] text-[var(--foreground-muted)]">12:34 min</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden bg-[var(--card-bg)] border border-[var(--border)]">
              <div className="aspect-video bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center">
                <Video size={32} className="text-[var(--accent)]" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">Gestion des utilisateurs</p>
                <p className="text-[10px] text-[var(--foreground-muted)]">08:21 min</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden bg-[var(--card-bg)] border border-[var(--border)]">
              <div className="aspect-video bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center">
                <Video size={32} className="text-[var(--accent)]" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">Facturation et paiements</p>
                <p className="text-[10px] text-[var(--foreground-muted)]">15:42 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}