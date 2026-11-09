// app/components/Products/StatsOverview.tsx
"use client";

import { Package, CircleDollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import StatCard from "@/app/components/Dashboard/StatCard";

interface StatsOverviewProps {
  stats: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    lowStock: number;
    outOfStock: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Produits"
        value={stats.totalProducts}
        icon={<Package size={18} />}
        color="cyan"
        delay={0}
      />
      
      <StatCard
        title="Valeur Inventaire"
        value={stats.totalValue}
        icon={<CircleDollarSign size={18} />}
        color="emerald"
        isCurrency
        delay={100}
      />
      
      <StatCard
        title="Stock Faible"
        value={stats.lowStock}
        icon={<AlertTriangle size={18} />}
        color="amber"
        trend={{
          value: 5,
          label: "vs mois dernier"
        }}
        delay={200}
      />
      
      <StatCard
        title="Rupture de Stock"
        value={stats.outOfStock}
        icon={<TrendingUp size={18} />}
        color="rose"
        trend={{
          value: -2,
          label: "vs mois dernier"
        }}
        delay={300}
      />
    </div>
  );
}