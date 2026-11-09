"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { settingsService } from "@/app/services/settingsService";
import { toast } from "sonner";

interface DeleteButtonProps {
  tenantId: string;
  token: string;
}

export function DeleteButton({ tenantId, token }: DeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ce tenant ? Cette action est irréversible.");
    if (!confirmed) return;

    try {
      const response = await settingsService.deleteTenant(token, tenantId);
      if (response.success) {
        toast.success("Tenant supprimé avec succès");
        router.push("/dashboard/settings/tenants");
        router.refresh();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error("Erreur lors de la suppression du tenant");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
    >
      <Trash2 size={14} />
      Supprimer
    </button>
  );
}