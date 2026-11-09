"use client";

import { useState } from "react";
import { Power, Loader2 } from "lucide-react";
import { productsService } from "@/app/services/products.Service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StatusToggleProps {
  id: string;
  isActive: boolean;
  token: string;
}

export default function StatusToggle({ id, isActive, token }: StatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      const response = await productsService.toggleStatus(id, !isActive, token);
      if (response.success) {
        toast.success(isActive ? "Produit désactivé" : "Produit activé");
        router.refresh();
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur réseau est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all active:scale-95 ${
        isActive 
          ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white' 
          : 'bg-[var(--accent)]/10 text-[var(--foreground-muted)] hover:bg-[var(--accent)] hover:text-white'
      }`}
    >
      {isLoading ? (
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <Power size={10} />
      )}
      {isActive ? "Actif" : "Inactif"}
    </button>
  );
}