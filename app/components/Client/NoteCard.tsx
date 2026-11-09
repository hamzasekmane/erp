"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Pin, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import { deleteClientNoteAction, togglePinNoteAction } from "@/app/actions/clientNoteActions";

interface NoteCardProps {
  note: any;
  onUpdate?: () => void;
}

export default function NoteCard({ note, onUpdate }: NoteCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPin, setIsTogglingPin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'follow-up': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'important': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'reminder': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case 'follow-up': return 'Suivi';
      case 'important': return 'Important';
      case 'reminder': return 'Rappel';
      default: return 'Général';
    }
  };

  const handleTogglePin = async () => {
    setIsTogglingPin(true);
    try {
      const result = await togglePinNoteAction(note._id, !note.isPinned);
      if (result.success) {
        toast.success(note.isPinned ? "Note désépinglée" : "Note épinglée");
        onUpdate?.();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsTogglingPin(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteClientNoteAction(note._id);
      if (result.success) {
        toast.success("Note supprimée avec succès");
        onUpdate?.();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="group bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5">
        
        {/* En-tête de la carte */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase border ${getCategoryColor(note.category)}`}>
                {getCategoryLabel(note.category)}
              </span>
              {note.isPinned && (
                <Pin size={12} className="text-amber-400" />
              )}
            </div>
            
            {/* Menu d'actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleTogglePin}
                disabled={isTogglingPin}
                className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all"
                title={note.isPinned ? "Désépingler" : "Épingler"}
              >
                {isTogglingPin ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Pin size={14} className={note.isPinned ? "text-amber-400" : ""} />
                )}
              </button>
              <Link
                href={`/dashboard/clients/notes/edit/${note._id}`}
                className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all"
              >
                <Edit2 size={14} />
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
              <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Titre et contenu */}
          <Link href={`/dashboard/clients/notes/${note._id}`}>
            <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
              {note.title}
            </h3>
            <p className="text-xs text-zinc-400 mt-2 line-clamp-3">
              {note.content}
            </p>
          </Link>

          {/* Informations client et date */}
          <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
            <Link
              href={`/dashboard/clients/${note.clientId._id}`}
              className="flex items-center gap-2 text-xs hover:text-amber-400 transition-colors group/client"
            >
              <User size={12} className="text-zinc-500 group-hover/client:text-amber-400" />
              <span className="font-bold">{note.clientId.name}</span>
              <span className="text-[8px] text-zinc-500">{note.clientId.code}</span>
            </Link>
            
            <div className="flex items-center gap-2 text-[9px] text-zinc-500">
              <Calendar size={10} />
              {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer la note"
        message={`Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.`}
      />
    </>
  );
}