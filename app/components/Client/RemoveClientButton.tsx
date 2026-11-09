// app/components/Client/RemoveClientButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { removeClientsFromGroupAction } from "@/app/actions/clientGroupActions";

interface RemoveClientButtonProps {
  groupId: string;
  clientId: string;
  clientName: string;
}

export default function RemoveClientButton({ groupId, clientId, clientName }: RemoveClientButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    if (!confirm(`Voulez-vous retirer ${clientName} du groupe ?`)) {
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeClientsFromGroupAction(groupId, [clientId]);
      
      if (result.success) {
        toast.success(`${clientName} a été retiré du groupe`);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors du retrait");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isRemoving}
      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"
      title="Retirer du groupe"
    >
      {isRemoving ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <UserMinus size={14} />
      )}
    </button>
  );
}