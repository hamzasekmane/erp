'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function CreateApiKeyForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['read'],
    expiresIn: 'never',
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const permissionsList = [
    { value: 'read', label: 'Lecture', description: 'Lire les données' },
    { value: 'write', label: 'Écriture', description: 'Créer et modifier des données' },
    { value: 'delete', label: 'Suppression', description: 'Supprimer des données' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock generated key
      const mockKey = `velora_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setGeneratedKey(mockKey);
    } catch (err) {
      setError('Erreur lors de la création de la clé API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      alert('Clé copiée dans le presse-papier');
    }
  };

  const handleDone = () => {
    router.push('/dashboard/settings/api');
  };

  if (generatedKey) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-black mb-2">Clé API créée avec succès !</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Conservez cette clé précieusement. Elle ne sera plus affichée.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-500">Important</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Cette clé ne sera plus jamais affichée. Assurez-vous de la copier et de la stocker en lieu sûr.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-medium mb-2 block">Votre nouvelle clé API</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-[var(--background)] p-3 rounded-lg break-all">
              {generatedKey}
            </code>
            <button
              onClick={handleCopyKey}
              className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-colors"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={handleDone}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

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
          placeholder="ex: Production API Key"
          className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-indigo-500/50"
        />
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Un nom descriptif pour identifier cette clé
        </p>
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

      {/* Expiration */}
      <div>
        <label className="text-sm font-medium mb-2 block">Expiration</label>
        <select
          value={formData.expiresIn}
          onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
          className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-indigo-500/50"
        >
          <option value="never">Jamais</option>
          <option value="30d">30 jours</option>
          <option value="90d">90 jours</option>
          <option value="1y">1 an</option>
        </select>
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
          disabled={isLoading || !formData.name}
          className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Création...' : 'Créer la clé API'}
        </button>
      </div>
    </form>
  );
}