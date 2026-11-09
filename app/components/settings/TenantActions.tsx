// app/components/settings/TenantActions.tsx
"use client";

import { Edit, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface TenantActionsProps {
  tenantId: string;
  tenantName: string;
  token: string;
}

export function TenantActions({ tenantId, tenantName, token }: TenantActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `⚠️ Êtes-vous sûr de vouloir supprimer le tenant "${tenantName}" ?\n\n` +
      "Cette action est irréversible et supprimera :\n" +
      "• Toutes les données associées\n" +
      "• Tous les utilisateurs\n" +
      "• Toutes les factures et documents\n\n" +
      "Cette action ne peut pas être annulée."
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Appel à l'API de suppression
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="font-bold">Tenant supprimé</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {tenantName} a été supprimé définitivement
              </p>
            </div>
          </div>,
          { duration: 4000 }
        );
        
        startTransition(() => {
          router.push("/dashboard/settings/tenants");
          router.refresh();
        });
      } else {
        throw new Error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error(
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-500" />
          <div>
            <p className="font-bold">Erreur</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Impossible de supprimer le tenant
            </p>
          </div>
        </div>
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/settings/tenants/${tenantId}/edit`}
        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
      >
        <Edit size={14} />
        Modifier
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting || isPending}
        className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? (
          <>
            <div className="w-3 h-3 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            Suppression...
          </>
        ) : (
          <>
            <Trash2 size={14} />
            Supprimer
          </>
        )}
      </button>
    </div>
  );
}