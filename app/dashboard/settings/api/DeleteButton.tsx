'use client';

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

interface DeleteButtonProps {
  apiKeyId: string;
  apiKeyName: string;
  onDelete?: () => void;
}

export function DeleteButton({ apiKeyId, apiKeyName, onDelete }: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Call onDelete callback if provided
      if (onDelete) onDelete();
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-500" />
            <h3 className="text-lg font-black">Confirmer la révocation</h3>
          </div>
          <p className="text-sm text-[var(--foreground-muted)] mb-6">
            Êtes-vous sûr de vouloir révoquer la clé API "{apiKeyName}" ? 
            Cette action est irréversible et toutes les intégrations utilisant cette clé cesseront de fonctionner.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Révocation...' : 'Révoquer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
      title="Révoquer"
    >
      <Trash2 size={16} className="text-red-500" />
    </button>
  );
}