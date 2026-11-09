import { Metadata } from "next";
import Link from "next/link";
import {
  RefreshCw,
  Rocket,
  Bug,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Calendar,
  Tag,
  CheckCircle,
  Bell
} from "lucide-react";

export const metadata: Metadata = {
  title: "Nouveautés | Velora ERP",
  description: "Découvrez les dernières mises à jour et fonctionnalités",
};

interface Release {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  features: { title: string; description: string }[];
  improvements: string[];
  fixes: string[];
}

export default function ChangelogPage() {
  const releases: Release[] = [
    {
      version: "v2.0.0",
      date: "15 janvier 2024",
      type: "major",
      features: [
        { title: "Nouveau tableau de bord", description: "Interface repensée avec des widgets personnalisables" },
        { title: "Support multi-devises", description: "Gérez vos factures dans plusieurs devises" },
        { title: "API v2", description: "Nouvelle API REST avec documentation interactive" },
      ],
      improvements: [
        "Performance améliorée de 40%",
        "Interface utilisateur optimisée pour mobile",
        "Temps de chargement réduit",
      ],
      fixes: [
        "Correction du bug d'export PDF",
        "Fix des notifications push",
        "Résolution des problèmes de synchronisation",
      ],
    },
    {
      version: "v1.5.0",
      date: "10 décembre 2023",
      type: "minor",
      features: [
        { title: "Rapports avancés", description: "Nouveaux rapports analytiques" },
        { title: "Intégration Stripe", description: "Paiements en ligne simplifiés" },
      ],
      improvements: [
        "Meilleure gestion des erreurs",
        "Accessibilité améliorée",
      ],
      fixes: [
        "Correction des liens cassés",
        "Fix du filtre de recherche",
      ],
    },
  ];

  const getTypeColor = (type: string) => {
    switch(type) {
      case "major": return "from-rose-500/20 to-rose-500/5 border-rose-500/30";
      case "minor": return "from-blue-500/20 to-blue-500/5 border-blue-500/30";
      case "patch": return "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30";
      default: return "from-[var(--accent)]/20 to-[var(--accent)]/5";
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "major": return <Rocket size={18} className="text-rose-500" />;
      case "minor": return <Sparkles size={18} className="text-blue-500" />;
      case "patch": return <Zap size={18} className="text-emerald-500" />;
      default: return <RefreshCw size={18} className="text-[var(--accent)]" />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 rounded-xl">
                <RefreshCw size={24} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                    VELORA • CHANGELOG
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Nouveautés
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                  Découvrez toutes les améliorations et nouvelles fonctionnalités
                </p>
              </div>
            </div>
          </div>
          
          {/* Subscribe */}
          <Link
            href="#"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors"
          >
            <Bell size={16} />
            S'abonner aux mises à jour
          </Link>
        </div>

        {/* Releases */}
        <div className="space-y-6">
          {releases.map((release) => (
            <div
              key={release.version}
              className={`bg-gradient-to-br ${getTypeColor(release.type)} border rounded-2xl p-6`}
            >
              {/* Version Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-3">
                  {getTypeIcon(release.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black">{release.version}</h2>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        release.type === "major" ? "bg-rose-500/20 text-rose-500" :
                        release.type === "minor" ? "bg-blue-500/20 text-blue-500" :
                        "bg-emerald-500/20 text-emerald-500"
                      }`}>
                        {release.type === "major" ? "MAJEUR" : release.type === "minor" ? "MINEUR" : "CORRECTIF"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={12} className="text-[var(--foreground-muted)]" />
                      <p className="text-xs text-[var(--foreground-muted)]">{release.date}</p>
                    </div>
                  </div>
                </div>
                <Link href="#" className="text-xs text-[var(--accent)] hover:underline">
                  Notes de version →
                </Link>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                  <Rocket size={14} className="text-[var(--accent)]" />
                  Nouvelles fonctionnalités
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {release.features.map((feature, idx) => (
                    <div key={idx} className="p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]">
                      <p className="text-sm font-medium mb-1">{feature.title}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements & Fixes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-500" />
                    Améliorations
                  </h3>
                  <ul className="space-y-2">
                    {release.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle size={12} className="text-emerald-500" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                    <Bug size={14} className="text-amber-500" />
                    Correctifs
                  </h3>
                  <ul className="space-y-2">
                    {release.fixes.map((fix, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle size={12} className="text-amber-500" />
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="bg-gradient-to-r from-[var(--accent)]/10 to-transparent rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield size={18} className="text-purple-500" />
            </div>
            <h3 className="text-base font-black">Bientôt disponible</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-[var(--card-bg)] rounded-lg">
              <p className="text-sm font-medium">Intelligence Artificielle</p>
              <p className="text-xs text-[var(--foreground-muted)]">Prédictions et recommandations</p>
            </div>
            <div className="p-3 bg-[var(--card-bg)] rounded-lg">
              <p className="text-sm font-medium">Mobile App</p>
              <p className="text-xs text-[var(--foreground-muted)]">Application iOS et Android</p>
            </div>
            <div className="p-3 bg-[var(--card-bg)] rounded-lg">
              <p className="text-sm font-medium">Marketplace</p>
              <p className="text-xs text-[var(--foreground-muted)]">Extensions et plugins</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}