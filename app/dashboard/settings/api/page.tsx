'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  RefreshCw,
  ArrowLeft,
  Shield,
  Clock,
  Activity,
  Webhook,
  FileJson,
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { CopyButton } from './CopyButton';
import { DeleteButton } from './DeleteButton';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastDigits: string;
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  permissions: string[];
  status: "active" | "expired" | "revoked";
  usageCount: number;
}

export default function ApiSettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch API keys from your backend
    const fetchApiKeys = async () => {
      try {
        // Replace with your actual API call
        const mockData: ApiKey[] = [
          {
            id: "1",
            name: "Production API Key",
            key: "velora_live_4f8d9e2c1a7b6d5e8f9a2b3c4d5e6f7a",
            lastDigits: "••••••••f7a",
            createdAt: "2024-01-15T10:00:00Z",
            lastUsed: "2024-01-20T15:30:00Z",
            expiresAt: null,
            permissions: ["read", "write", "delete"],
            status: "active",
            usageCount: 1247,
          },
          {
            id: "2",
            name: "Development Key",
            key: "velora_test_3e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b",
            lastDigits: "••••••••c3b",
            createdAt: "2024-01-10T14:00:00Z",
            lastUsed: "2024-01-19T11:20:00Z",
            expiresAt: "2025-01-10T14:00:00Z",
            permissions: ["read"],
            status: "active",
            usageCount: 342,
          },
          {
            id: "3",
            name: "Webhook Integration",
            key: "velora_webhook_2a1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
            lastDigits: "••••••••5c6d",
            createdAt: "2024-01-05T09:00:00Z",
            lastUsed: null,
            expiresAt: "2024-07-05T09:00:00Z",
            permissions: ["read", "write"],
            status: "active",
            usageCount: 0,
          },
        ];
        setApiKeys(mockData);
      } catch (error) {
        console.error("Error fetching API keys:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  const activeKeys = apiKeys.filter(k => k.status === "active").length;
  const totalUsage = apiKeys.reduce((sum, k) => sum + k.usageCount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-500"><CheckCircle size={10} />Actif</span>;
      case "expired":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-500"><AlertCircle size={10} />Expiré</span>;
      case "revoked":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/20 text-gray-500">Révoqué</span>;
      default:
        return null;
    }
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="p-2 hover:bg-[var(--accent)]/10 rounded-xl transition-colors group"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--accent)]" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 rounded-xl">
              <Key size={20} className="text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  VELORA • API
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                  ● KEYS
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
                Clés <span className="text-indigo-500">API</span>
              </h1>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">
                Gérez vos clés API et intégrations
              </p>
            </div>
          </div>
        </div>
        
        <Link
          href="/dashboard/settings/api/new"
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} />
          Nouvelle clé API
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Key size={16} className="text-indigo-500" />
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">TOTAL</span>
          </div>
          <p className="text-2xl font-black">{apiKeys.length}</p>
          <p className="text-[10px] text-[var(--foreground-muted)]">Clés API créées</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Activity size={16} className="text-emerald-500" />
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">ACTIF</span>
          </div>
          <p className="text-2xl font-black text-emerald-500">{activeKeys}</p>
          <p className="text-[10px] text-[var(--foreground-muted)]">Clés actives</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <RefreshCw size={16} className="text-blue-500" />
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">USAGE</span>
          </div>
          <p className="text-2xl font-black">{totalUsage.toLocaleString()}</p>
          <p className="text-[10px] text-[var(--foreground-muted)]">Requêtes totales</p>
        </div>
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Webhook size={16} className="text-purple-500" />
            <span className="text-[8px] font-mono text-[var(--foreground-muted)]">WEBHOOKS</span>
          </div>
          <p className="text-2xl font-black">3</p>
          <p className="text-[10px] text-[var(--foreground-muted)]">Endpoints configurés</p>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h3 className="text-lg font-black flex items-center gap-2">
            <Key size={18} className="text-indigo-500" />
            Vos clés API
          </h3>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Gérez et configurez vos clés d'accès à l'API
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <tr>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Nom</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Clé API</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Permissions</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Statut</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Dernière utilisation</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium">{apiKey.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">Créée le {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-xs font-mono bg-[var(--background)] px-2 py-1 rounded">
                      {apiKey.lastDigits}
                    </code>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {apiKey.permissions.map((perm, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(apiKey.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-[var(--foreground-muted)]" />
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : "Jamais"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/settings/api/${apiKey.id}`}
                        className="p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye size={16} className="text-indigo-500" />
                      </Link>
                      <CopyButton text={apiKey.key} />
                      <DeleteButton 
                        apiKeyId={apiKey.id} 
                        apiKeyName={apiKey.name}
                        onDelete={() => handleDeleteKey(apiKey.id)}
                      />
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <Webhook size={18} className="text-purple-500" />
                Webhooks
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                Configurez des endpoints pour recevoir des événements en temps réel
              </p>
            </div>
            <button className="px-3 py-1.5 text-sm bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center gap-1">
              <Plus size={14} />
              Ajouter
            </button>
          </div>
        </div>
        <div className="p-6 text-center text-[var(--foreground-muted)]">
          <Webhook size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun webhook configuré</p>
          <p className="text-xs mt-1">Ajoutez votre premier endpoint webhook pour recevoir des événements</p>
        </div>
      </div>

      {/* API Documentation Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="#"
          className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-indigo-500/50 transition-all flex items-center gap-3"
        >
          <FileJson size={20} className="text-indigo-500" />
          <div>
            <p className="text-sm font-medium">Documentation API</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Guide complet et références</p>
          </div>
        </Link>
        <Link
          href="#"
          className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-indigo-500/50 transition-all flex items-center gap-3"
        >
          <Shield size={20} className="text-emerald-500" />
          <div>
            <p className="text-sm font-medium">Bonnes pratiques de sécurité</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Sécurisez vos intégrations</p>
          </div>
        </Link>
      </div>

      {/* Security Note */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Lock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">Sécurité des clés API</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              Ne partagez jamais vos clés API. Pour des raisons de sécurité, les clés ne sont affichées qu'une seule fois lors de la création.
              Utilisez des variables d'environnement pour stocker vos clés dans vos applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}