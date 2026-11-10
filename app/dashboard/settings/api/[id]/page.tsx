import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  Clock,
  Activity,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export const metadata: Metadata = {
  title: "Velora ERP | Détails clé API",
  description: "Consultez les détails de votre clé API",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ApiKeyDetailPage({ params }: PageProps) {
  const { id } = params;

  // Mock data - replace with real API call
  const apiKey = {
    id: id,
    name: "Production API Key",
    key: "velora_live_4f8d9e2c1a7b6d5e8f9a2b3c4d5e6f7a",
    createdAt: "2024-01-15T10:00:00Z",
    lastUsed: "2024-01-20T15:30:00Z",
    expiresAt: null,
    permissions: ["read", "write", "delete"],
    status: "active",
    usageCount: 1247,
    lastRequests: [
      { endpoint: "/api/invoices", method: "GET", status: 200, ip: "192.168.1.1", time: "2024-01-20T15:30:00Z" },
      { endpoint: "/api/clients", method: "POST", status: 201, ip: "192.168.1.1", time: "2024-01-20T14:15:00Z" },
      { endpoint: "/api/products", method: "GET", status: 200, ip: "192.168.1.1", time: "2024-01-20T13:00:00Z" },
    ]
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings/api"
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
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter">
            Détails de la <span className="text-indigo-500">clé API</span>
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">
            Consultez et gérez les détails de votre clé
          </p>
        </div>
      </div>

      {/* Key Info Card */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-black">{apiKey.name}</h3>
            <p className="text-xs text-[var(--foreground-muted)]">ID: {apiKey.id}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/settings/api/${id}/edit`}
              className="px-3 py-1.5 text-sm bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
            >
              <Edit size={14} />
              Modifier
            </Link>
            <button className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-1">
              <Trash2 size={14} />
              Révoquer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Clé API</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-[var(--background)] p-2 rounded-lg">
                {apiKey.key.substring(0, 20)}...{apiKey.key.substring(apiKey.key.length - 10)}
              </code>
              <button className="p-2 hover:bg-[var(--accent)]/10 rounded-lg">
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Statut</label>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500">
                <CheckCircle size={12} />
                Actif
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Permissions</label>
            <div className="mt-1 flex gap-2">
              {apiKey.permissions.map((perm, idx) => (
                <span key={idx} className="text-xs px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                  {perm}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Date d'expiration</label>
            <p className="mt-1 text-sm">{apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : "Jamais"}</p>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Créée le</label>
            <p className="mt-1 text-sm">{new Date(apiKey.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)]">Dernière utilisation</label>
            <p className="mt-1 text-sm">{apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : "Jamais"}</p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-indigo-500" />
            <h3 className="text-base font-black">Statistiques d'utilisation</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--foreground-muted)]">Requêtes totales</span>
              <span className="text-xl font-black">{apiKey.usageCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--foreground-muted)]">Moyenne par jour</span>
              <span className="text-xl font-black">{(apiKey.usageCount / 30).toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--foreground-muted)]">Taux de succès</span>
              <span className="text-xl font-black text-emerald-500">99.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-emerald-500" />
            <h3 className="text-base font-black">Sécurité</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--foreground-muted)]">Dernier accès</span>
              <span className="text-sm">192.168.1.1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--foreground-muted)]">User-Agent</span>
              <span className="text-sm truncate max-w-[200px]">Mozilla/5.0...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--foreground-muted)]">Restrictions IP</span>
              <span className="text-sm text-amber-500">Aucune</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h3 className="text-base font-black flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" />
            Dernières requêtes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <tr>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Endpoint</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Méthode</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Statut</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">IP</th>
                <th className="text-left p-4 text-xs font-black uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {apiKey.lastRequests.map((req, idx) => (
                <tr key={idx} className="border-b border-[var(--border)]">
                  <td className="p-4 text-sm font-mono">{req.endpoint}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      req.method === "GET" ? "bg-blue-500/20 text-blue-500" :
                      req.method === "POST" ? "bg-emerald-500/20 text-emerald-500" :
                      "bg-amber-500/20 text-amber-500"
                    }`}>
                      {req.method}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      req.status >= 200 && req.status < 300 ? "bg-emerald-500/20 text-emerald-500" :
                      "bg-red-500/20 text-red-500"
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--foreground-muted)]">{req.ip}</td>
                  <td className="p-4 text-sm text-[var(--foreground-muted)]">{new Date(req.time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}