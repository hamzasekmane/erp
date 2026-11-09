"use client";
import { useEffect } from "react";
import { toast } from "sonner"; // Or your preferred toast library
import { AlertTriangle, PackageSearch } from "lucide-react";

interface DashboardAlertsProps {
  lowStockCount: number;
  criticalItems: string[];
}

export default function DashboardAlerts({ lowStockCount, criticalItems }: DashboardAlertsProps) {
  useEffect(() => {
    if (lowStockCount > 0) {
      // Delay slightly so it doesn't pop while the page is still fading in
      const timer = setTimeout(() => {
        toast.error(`Alerte Stock: ${lowStockCount} articles critiques`, {
          description: `Les articles comme ${criticalItems.slice(0, 2).join(", ")} sont presque épuisés.`,
          icon: <AlertTriangle className="text-rose-500" size={18} />,
          duration: 6000,
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [lowStockCount, criticalItems]);

  return null; // This component doesn't render anything visually
}