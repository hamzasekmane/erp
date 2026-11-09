"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { clientGroupService } from "@/app/services/clientGroupService";

interface DeleteGroupButtonProps {
  groupId: string;
  groupName: string;
  token: string;  // ← Add token prop
}

export default function DeleteGroupButton({ groupId, groupName, token }: DeleteGroupButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      const result = await clientGroupService.deleteGroup(groupId, token);
      
      if (result.success) {
        toast.success("Groupe supprimé avec succès");
        router.push("/dashboard/clients/groups");
        router.refresh();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-rose-400"
        title="Supprimer"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        title="Supprimer le groupe"
        message={`Supprimer "${groupName}" ? Cette action est irréversible.`}
      />
    </>
  );
}