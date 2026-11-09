"use client";

import { Calendar, ChevronDown, RefreshCw, FileSpreadsheet, FileText, Printer } from "lucide-react";
import Link from "next/link";
import ExportReportsButton from "./ExportReportsButton";
import QuickActionCard from "../QuickActionCard";

interface ReportsActionsProps {
  stats: {
    summary: any[];
    methods: any[];
    daily: any[];
  };
}

export default function ReportsActions({ stats }: ReportsActionsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Actions Row */}
      <div className="flex items-center gap-3">
        {/* Export Reports Button */}
        <ExportReportsButton stats={stats} />

        {/* Period Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-black uppercase hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            <Calendar size={14} />
            Ce mois
            <ChevronDown size={12} />
          </button>
        </div>

        {/* Refresh Button */}
        <Link 
          href="/dashboard/payment/reports" 
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
        >
          <RefreshCw size={14} />
        </Link>
      </div>

      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard 
          title="Rapport Détaillé"
          description="Export complet des transactions avec filtres"
          icon={<FileSpreadsheet size={18} />}
          href="/dashboard/payment"
          color="emerald"
        />
        <QuickActionCard 
          title="Analyse Périodique"
          description="Comparaison mois par mois"
          icon={<FileText size={18} />}
          href="/dashboard/payment/reports/periodic"
          color="blue"
        />
        <QuickActionCard 
          title="Imprimer"
          description="Version imprimable du rapport"
          icon={<Printer size={18} />}
          href="#"
          color="amber"
          onClick={() => window.print()}
        />
      </div>
    </div>
  );
}