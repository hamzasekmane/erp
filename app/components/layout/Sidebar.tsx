"use client";
import { useActionState, useEffect, startTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Mail,
  XCircle,
  MessageSquare,
  Download,
  Filter,
  Database,
  BarChart3,
  CreditCard,
  Bell,
  Building,
  User,
  Shield,
  Repeat,
  TrendingUp,
  Grid,
  FileJson,
  Key,
  Globe,
  HardDrive,
  RefreshCw,
  Clock,
  Receipt,
  Wallet,
  Activity,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { logout } from "@/app/actions/logout";
 import { icon } from "@fortawesome/fontawesome-svg-core";   

interface SidebarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
    id?: string;
    _id?: string;
  } | null;
}

const initialState = {
  openCategory: "",
  recentlyUsed: [] as string[],
};

async function toggleCategoryAction(prevState: any, formData: FormData) {
  const category = formData.get("category") as string;
  const recentlyUsed = prevState.recentlyUsed || [];
  const updatedRecent = [
    category,
    ...recentlyUsed.filter((c: string) => c !== category),
  ].slice(0, 3);

  return {
    openCategory: prevState.openCategory === category ? "" : category,
    recentlyUsed: updatedRecent,
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [state, formAction] = useActionState(
    toggleCategoryAction,
    initialState,
  );

  // Menu sections (same as before)
  const menuSections = [
    { name: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
    {
      title: "Factures",
      icon: FileText,
      href: "/dashboard/invoices",
      items: [
        { label: "Toutes les factures", href: "/dashboard/invoices", icon: FileText },
        { label: "Nouvelle facture", href: "/dashboard/invoices/new", icon: Plus },
        { label: "Modèles", href: "/dashboard/invoices/templates", icon: FileSpreadsheet },
        { label: "Récurrentes", href: "/dashboard/invoices?status=recurring", icon: Repeat },
        { label: "Brouillons", href: "/dashboard/invoices?status=drafts", icon: AlertCircle },
        { label: "Envoyées", href: "/dashboard/invoices?status=sent", icon: Mail },
        { label: "Payées", href: "/dashboard/invoices?status=paid", icon: CheckCircle },
        { label: "Impayées", href: "/dashboard/invoices?status=overdue", icon: XCircle },
        { label: "Importer", href: "/dashboard/invoices/import", icon: Download },
      ],
    },
    {
      title: "Clients",
      icon: Users,
      href: "/dashboard/clients",
      items: [
        { label: "Tous les clients", href: "/dashboard/clients", icon: Users },
        { label: "Ajouter client", href: "/dashboard/clients/new", icon: Plus },
        { label: "Groupes", href: "/dashboard/clients/groups", icon: Grid },
        { label: "Notes", href: "/dashboard/clients/notes", icon: MessageSquare },
        { label: "Importer", href: "/dashboard/clients/import", icon: Download },
      ],
    },
    {
      title: "Produits",
      icon: Package,
      href: "/dashboard/products",
      items: [
        { label: "Tous les produits", href: "/dashboard/products", icon: Package },
        { label: "Ajouter produit", href: "/dashboard/products/new", icon: Plus },
        { label: "Catégories", href: "/dashboard/categories", icon: Filter },
        { label: "Stock", href: "/dashboard/products/inventory", icon: Database },
        { label: "Taux de TVA", href: "/dashboard/products/tax-rates", icon: BarChart3 },
      ],
    },
    {
      title: "Paiements",
      icon: CreditCard,
      href: "/dashboard/payment",
      items: [
        { label: "Tous les paiements", href: "/dashboard/payment", icon: CreditCard },
        { label: "Méthodes", href: "/dashboard/payment/methods", icon: Wallet },
        { label: "Passerelles", href: "/dashboard/payment/gateways", icon: Globe },
        { label: "Rapports", href: "/dashboard/payment/reports", icon: BarChart3 },
        { label: "Rapprochement", href: "/dashboard/payment/reconcile", icon: RefreshCw },
      ],
    },
    {
      title: "Rapports",
      icon: BarChart3,
      href: "/dashboard/report",
      items: [
        { label: "Financier", href: "/dashboard/report/financial", icon: TrendingUp },
        { label: "Fiscal", href: "/dashboard/report/tax", icon: FileSpreadsheet },
        { label: "Clients", href: "/dashboard/report/clients", icon: Users },
        { label: "Produits", href: "/dashboard/report/products", icon: Package },
        { label: "Personnalisé", href: "/dashboard/report/custom", icon: FileText },
      ],
    },
    {
      title: "Abonnements",
      icon: Repeat,
      href: "/dashboard/subscription",
      items: [
        { label: "Tous les abonnements", href: "/dashboard/subscription", icon: Repeat },
        { label: "Créer un plan", href: "/dashboard/subscription/create", icon: Plus },
        { label: "Analytiques", href: "/dashboard/subscription/analytics", icon: Activity },
        { label: "Historique", href: "/dashboard/subscription/history", icon: Clock },
      ],
    },
    {
      title: "Ressources Humaines",
      icon: Users,
      href: "/dashboard/hr",
      items: [
        { label: "Tous les employés", href: "/dashboard/hr/employees", icon: Users },
        { label: "Ajouter employé", href: "/dashboard/hr/employees/new", icon: Plus },
        { label: "Départements", href: "/dashboard/hr/departments", icon: Grid },
        { label: "Présences", href: "/dashboard/hr/attendance", icon: Clock },
        { label: "Congés", href: "/dashboard/hr/leaves", icon: Calendar },
        { label: "Paies", href: "/dashboard/hr/payroll", icon: CreditCard },
        { label: "Contrats", href: "/dashboard/hr/contracts", icon: FileText },
        { label: "Notes", href: "/dashboard/hr/notes", icon: MessageSquare },
      ],
    },
    {
      title: "Services",
      icon: HardDrive,
      href: "/dashboard/services",
      items: [
        { label: "Email", href: "/dashboard/services/email", icon: Mail },
        { label: "PDF", href: "/dashboard/services/pdf", icon: FileText },
        { label: "SMS", href: "/dashboard/services/sms", icon: MessageSquare },
        { label: "Notifications", href: "/dashboard/services/notifications", icon: Bell },
        { label: "Sauvegarde", href: "/dashboard/services/file/backup", icon: Database },
      ],
    },
    {
      title: "Analytiques",
      icon: TrendingUp,
      href: "/dashboard/analytics",
      items: [
        { label: "Tableau de bord KPI", href: "/dashboard/analytics/kpi", icon: Activity },
        { label: "Prévisions", href: "/dashboard/analytics/forecast", icon: TrendingUp },
        { label: "Benchmarking", href: "/dashboard/analytics/benchmark", icon: BarChart3 },
        { label: "Tableaux croisés", href: "/dashboard/analytics/pivot", icon: Grid },
        { label: "Export données", href: "/dashboard/analytics/export", icon: Download },
      ],
    },
    {
      title: "Archives",
      icon: Database,
      href: "/dashboard/archives",
      items: [
        { label: "Factures archivées", href: "/dashboard/archives/invoices", icon: FileText },
        { label: "Clients archivés", href: "/dashboard/archives/clients", icon: Users },
        { label: "Produits archivés", href: "/dashboard/archives/products", icon: Package },
        { label: "Documents", href: "/dashboard/archives/documents", icon: FileSpreadsheet },
      ],
    },
    {
      title: "Paramètres",
      icon: Settings,
      href: "/dashboard/settings",
      items: [
        { label: "Société", href: "/dashboard/settings/company", icon: Building },
        { label: "Paiement", href: "/dashboard/settings/payment", icon: CreditCard },
        { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
        { label: "Utilisateurs", href: "/dashboard/settings/users", icon: User },
        { label: "Locataires", href: "/dashboard/settings/tenants", icon: Shield },
        { label: "Facturation", href: "/dashboard/settings/billing", icon: Receipt },
        { label: "API", href: "/dashboard/settings/api", icon: FileJson },
        { label: "Sécurité", href: "/dashboard/settings/security", icon: Key },
      ],
    },
  ];

  useEffect(() => {
    const currentSection = menuSections.find(
      (section) => section.items && pathname.startsWith(section.href),
    );
    if (currentSection && state.openCategory !== currentSection.title) {
      const formData = new FormData();
      formData.append("category", currentSection.title || "");
      startTransition(() => {
        formAction(formData);
      });
    }
  }, [pathname]);

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="w-full bg-[var(--background)] text-[var(--foreground)] flex flex-col h-full transition-colors duration-300 overflow-y-auto custom-scrollbar"
      dir="ltr"
    >
{/* HEADER */}
<div className="sticky top-0 bg-[var(--background)] z-20 border-b border-[var(--border)] backdrop-blur-md bg-opacity-80">
  <div className="p-5">
    <Link href="/dashboard" className="flex items-center gap-2.5 group w-fit">
      
      <div className="flex flex-col">
        <div className="flex items-baseline">
          {/* Première partie du logo */}
          <span className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter group-hover:-translate-y-0.5 transition-transform duration-300">
            Val
          </span>
          
          {/* Seconde partie avec le dégradé spécifique [#f43f5e] */}
          <span className="text-2xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-[#f43f5e] group-hover:translate-y-0.5 transition-transform duration-300">
            ora
          </span>
        </div>
        
        {/* Sous-titre ERP avec espacement large pour le look premium */}
        <span className="text-[10px] font-black text-black-400 uppercase tracking-[0.4em] -mt-1 ml-0.5">
          ERP
        </span>
      </div>
    </Link>
  </div>
</div>

      {/* MENU */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-0.5">
          {menuSections.map((section) => {
            const isCollapsible = !!section.items;
            const isOpen =
              state.openCategory === section.title ||
              (isCollapsible && pathname.startsWith(section.href));
            const isActive = isActiveRoute(section.href);
            const Icon = section.icon;

            return (
              <div key={section.title || section.name} className="flex flex-col">
                {isCollapsible ? (
                  <form action={formAction}>
                    <input type="hidden" name="category" value={section.title} />
                    <button
                      type="submit"
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group ${
                        isActive
                          ? "bg-[var(--accent)]/20 text-[var(--accent)] font-medium border border-[var(--accent)]/30"
                          : "text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                        <span className="text-xs font-bold tracking-tight">
                          {section.title}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-[var(--foreground-muted)] transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </form>
                ) : (
                  <Link
                    href={section.href}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      pathname === section.href
                        ? "bg-[var(--accent)]/20 text-[var(--accent)] font-medium border border-[var(--accent)]/30"
                        : "text-[var(--foreground-muted)] hover:bg-[var(--card-bg)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={pathname === section.href ? 2.2 : 1.8}
                    />
                    <span className="text-xs font-bold tracking-tight">
                      {section.name}
                    </span>
                  </Link>
                )}

                {isCollapsible && isOpen && (
                  <div className="mt-1 ml-4 pl-4 border-l-2 border-[var(--accent)]/30 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                    {section.items.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={`flex items-center gap-3 p-2 rounded-lg text-[11px] transition-all ${
                            isSubActive
                              ? "text-[var(--accent)] font-bold bg-[var(--accent)]/10"
                              : "text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--card-bg)]"
                          }`}
                        >
                          <SubIcon
                            size={12}
                            strokeWidth={isSubActive ? 2.2 : 1.8}
                          />
                          <span className="truncate">{sub.label}</span>
                          {sub.label.includes("Impayées") && (
                            <span className="ml-auto text-[8px] font-bold bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-500/30">
                              3
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)] p-4 mt-auto">
        {/* <div className="flex items-center gap-3 p-2.5 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-sm mb-2">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--background-secondary)] to-[var(--card-bg-solid)] flex items-center justify-center text-[var(--foreground)] shadow-md">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  className="w-full h-full object-cover rounded-lg"
                  alt={user.name}
                />
              ) : (
                <span className="text-xs font-black text-[var(--accent)]">
                  {user?.name?.substring(0, 2).toUpperCase() || "AD"}
                </span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--background)]"></span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-black text-[var(--foreground)] uppercase truncate tracking-tight">
              {user?.name?.split(" ")[0]?.toUpperCase() || "BRAHIM"}
            </span>
            <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider truncate">
              {user?.role?.toUpperCase() || "ADMINISTRATEUR"}
            </span>
          </div>
        </div> */}

        <button
          onClick={async () => await logout()}
          className="flex items-center justify-center gap-2 p-2.5 w-full text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 rounded-xl transition-all text-xs font-bold group border border-rose-500/30 hover:border-rose-500"
        >
          <LogOut
            size={14}
            className="group-hover:-translate-x-1 group-hover:text-white transition-transform duration-300"
          />
          <span className="group-hover:text-white">DÉCONNEXION</span>
        </button>

        <div className="mt-3 text-center">
          <span className="text-[6px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.4em]">
            VELORA ERP v2.0
          </span>
          <p className="text-[6px] text-[var(--foreground-muted)] mt-1">
            © 2026 Tous droits réservés
          </p>
        </div>
      </div>
    </aside>
  );
}