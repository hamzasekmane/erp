// app/components/settings/TenantStats.tsx
"use client";

import { Users, HardDrive, CreditCard, Building2, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface TenantStatsProps {
  tenant: any;
}

export function TenantStats({ tenant }: TenantStatsProps) {
  // Utiliser les features correctement transformées
  const maxUsers = tenant.features?.users || 100;
  const maxInvoices = tenant.features?.invoices?.monthly || 1000;
  const storageLimit = tenant.features?.storage || 10240;
  
  const stats = [
    {
      label: "Utilisateurs",
      value: tenant.userCount || 0,
      max: maxUsers,
      unit: "",
      icon: Users,
      color: "accent",
      currentValue: tenant.userCount || 0
    },
    {
      label: "Factures",
      value: tenant.invoiceCount || 0,
      max: maxInvoices,
      unit: "",
      icon: FileText,
      color: "blue",
      currentValue: tenant.invoiceCount || 0
    },
    {
      label: "Stockage",
      value: 0, // À remplacer par tenant.storageUsed quand disponible
      max: storageLimit,
      unit: "MB",
      icon: HardDrive,
      color: "amber",
      currentValue: 0
    },
    {
      label: "Plan",
      value: tenant.plan?.toUpperCase() || "STANDARD",
      icon: Building2,
      color: "purple"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 hover:border-[var(--accent)]/50 transition-all group">
          <div className="flex items-center justify-between">
            <div className={`p-2 bg-${stat.color === 'accent' ? '[var(--accent)]' : stat.color}-500/10 rounded-lg group-hover:scale-110 transition-transform`}>
              <stat.icon size={16} className={`text-${stat.color === 'accent' ? '[var(--accent)]' : stat.color}-500`} />
            </div>
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">METRIC</span>
          </div>
          <p className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-wider">{stat.label}</p>
          <p className="text-2xl font-black text-[var(--foreground)]">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            {stat.unit ? ` ${stat.unit}` : ''}
          </p>
          {stat.max && typeof stat.currentValue === 'number' && stat.max !== Infinity && (
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div 
                className={`h-full bg-${stat.color === 'accent' ? '[var(--accent)]' : stat.color}-500 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min((stat.currentValue / stat.max) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}