'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditApiKeyFormProps {
  apiKeyId: string;
}

export function EditApiKeyForm({ apiKeyId }: EditApiKeyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Production API Key',
    permissions: ['read', 'write', 'delete'],
  });

  const permissionsList = [
    { value: 'read', label: 'Lecture', description: 'Lire les données' },
    { value: 'write', label: 'Écriture', description: 'Créer et modifier des données' },
    { value: 'delete', label: 'Suppression', description: 'Supprimer des données' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/dashboard/settings/api/${apiKeyId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
      {/* Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Nom de la clé <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Permissions */}
      <div>
        <label className="text-sm font-medium mb-2 block">Permissions</label>
        <div className="space-y-2">
          {permissionsList.map((perm) => (
            <label key={perm.value} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] cursor-pointer hover:bg-[var(--accent)]/5">
              <input
                type="checkbox"
                checked={formData.permissions.includes(perm.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, permissions: [...formData.permissions, perm.value] });
                  } else {
                    setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm.value) });
                  }
                }}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">{perm.label}</p>
                <p className="text-xs text-[var(--foreground-muted)]">{perm.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)]/5 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
}