import { Metadata } from "next";
import Link from "next/link";
import { serverApi } from "@/app/lib/serverApi";
import {
  Archive,
  FileText,
  Users,
  Package,
  FolderArchive,
  ChevronRight,
  Clock,
  HardDrive,
  TrendingUp
} from "lucide-react";

export const metadata: Metadata = {
  title: "Velora ERP | Archives",
  description: "Gérez vos éléments archivés",
};

interface ArchiveSection {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  count: number;
  color: string;
  bgColor: string;
}

export default async function ArchivesPage() {
  const stats = await serverApi<{ totalDocuments: number; byCategory: Array<{ category: string; count: number }> }>("/archives/stats");
  const countFor = (category: string) => stats?.byCategory.find((row) => row.category === category)?.count ?? 0;
  const documents = (await serverApi<Array<{ id: string; name: string; category: string; createdAt?: string }>>("/archives/documents?limit=5")) ?? [];

  const archiveSections: ArchiveSection[] = [
    {
      title: "Factures archivées",
      description: "Factures historiques et documents comptables",
      icon: FileText,
      href: "/dashboard/archives/invoices",
      count: countFor("invoice"),
      color: "text-blue-500",
      bgColor: "from-blue-500/20 to-blue-500/5",
    },
    {
      title: "Clients archivés",
      description: "Anciens clients et prospects inactifs",
      icon: Users,
      href: "/dashboard/archives/clients",
      count: countFor("client"),
      color: "text-emerald-500",
      bgColor: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      title: "Produits archivés",
      description: "Produits discontinués ou hors catalogue",
      icon: Package,
      href: "/dashboard/archives/products",
      count: countFor("product"),
      color: "text-purple-500",
      bgColor: "from-purple-500/20 to-purple-500/5",
    },
    {
      title: "Documents archivés",
      description: "Contrats, rapports et fichiers historiques",
      icon: FolderArchive,
      href: "/dashboard/archives/documents",
      count: stats?.totalDocuments ?? 0,
      color: "text-amber-500",
      bgColor: "from-amber-500/20 to-amber-500/5",
    },
  ];

  const totalArchived = archiveSections.reduce((sum, section) => sum + section.count, 0);
  const categoryLabels: Record<string, string> = {
    invoice: "Facture",
    client: "Client",
    product: "Produit",
    hr: "RH",
    contract: "Contrat",
    other: "Document",
  };
  const recentArchives = documents.map((document) => ({
    type: categoryLabels[document.category] ?? "Document",
    name: document.name,
    date: (document.createdAt ?? "").slice(0, 10),
    status: "Archivé",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--accent)]/5">
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl">
                <Archive size={24} className="text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                    VELORA • ARCHIVES
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    ● STORAGE
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  Archives & <span className="text-amber-500">Historique</span>
                </h1>
                <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                  Gérez vos données archivées et restaurez-les si nécessaire
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-center">
              <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Total archivé</p>
              <p className="text-xl font-black text-amber-500">{totalArchived}</p>
              <p className="text-[8px] text-[var(--foreground-muted)]">Éléments</p>
            </div>
            <div className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-center">
              <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase">Espace utilisé</p>
              <p className="text-xl font-black text-emerald-500">2.4 GB</p>
              <p className="text-[8px] text-[var(--foreground-muted)]">Sur 10 GB</p>
            </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Clock size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">30 JOURS</span>
            </div>
            <p className="text-lg font-black">+23</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Nouveaux archivages</p>
          </div>
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <HardDrive size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">STORAGE</span>
            </div>
            <p className="text-lg font-black">24%</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Espace utilisé</p>
          </div>
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">RESTORATIONS</span>
            </div>
            <p className="text-lg font-black">12</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Ce mois-ci</p>
          </div>
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Archive size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-[8px] font-mono text-[var(--foreground-muted)]">RETENTION</span>
            </div>
            <p className="text-lg font-black">365j</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Période de conservation</p>
          </div>
        </div>

        {/* ARCHIVE SECTIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {archiveSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className="group relative overflow-hidden bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${section.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={24} className={section.color} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-amber-500">{section.count}</p>
                      <p className="text-[8px] text-[var(--foreground-muted)]">Éléments</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black text-[var(--foreground)] mb-2">
                    {section.title}
                  </h3>
                  
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {section.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-xs text-amber-500 group-hover:gap-2 transition-all">
                    <span>Voir les archives</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* RECENT ARCHIVES TABLE */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Archives récentes
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Derniers éléments archivés
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
                <tr>
                  <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Nom</th>
                  <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Date d'archivage</th>
                  <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Statut</th>
                  <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentArchives.map((item, index) => (
                  <tr key={index} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors">
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-500">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium">{item.name}</td>
                    <td className="p-4 text-sm text-[var(--foreground-muted)]">{item.date}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-gray-500/20 text-gray-500">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors">
                        Restaurer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INFO NOTE */}
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Archive size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-500">Politique d'archivage</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Les données sont conservées pendant 365 jours dans les archives avant suppression définitive. 
                Vous pouvez restaurer n'importe quel élément archivé à tout moment pendant cette période.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}