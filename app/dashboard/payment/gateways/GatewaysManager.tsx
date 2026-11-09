// app/dashboard/payment/gateways/GatewaysManager.tsx
"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { paymentService } from "@/app/services/paymentServices";
import { Gateway, GatewayConfig } from "@/app/types/payment";
import {
  Power,
  PowerOff,
  Edit,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  CreditCard,
} from "lucide-react";

interface GatewaysManagerProps {
  initialGateways: Gateway[];
  token: string;
}

// Configuration fields per gateway
const getConfigFields = (code: string): Array<{
  key: string;
  label: string;
  type: "text" | "password" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  sensitive?: boolean;
}> => {
  switch (code) {
    case "stripe":
      return [
        { key: "apiKey", label: "Clé API publique", type: "text", placeholder: "pk_test_...", sensitive: false },
        { key: "secretKey", label: "Clé secrète", type: "password", placeholder: "sk_test_...", sensitive: true },
        { key: "webhookSecret", label: "Secret webhook", type: "password", placeholder: "whsec_...", sensitive: true },
      ];
    case "paypal":
      return [
        { key: "clientId", label: "Client ID", type: "text", placeholder: "AZxxx...", sensitive: false },
        { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "ELxxx...", sensitive: true },
        {
          key: "mode",
          label: "Mode",
          type: "select",
          options: [
            { value: "sandbox", label: "Sandbox (test)" },
            { value: "live", label: "Live (production)" },
          ],
          sensitive: false,
        },
      ];
    case "flutterwave":
      return [
        { key: "publicKey", label: "Clé publique", type: "text", placeholder: "FLWPUBK-...", sensitive: false },
        { key: "secretKey", label: "Clé secrète", type: "password", placeholder: "FLWSECK-...", sensitive: true },
        { key: "encryptionKey", label: "Clé de chiffrement", type: "password", placeholder: "FLWSECK-...", sensitive: true },
      ];
    default:
      return [
        { key: "apiKey", label: "Clé API", type: "text", sensitive: false },
        { key: "secret", label: "Secret", type: "password", sensitive: true },
      ];
  }
};

// Documentation URLs
const DOCS_URLS: Record<string, string> = {
  stripe: "https://docs.stripe.com",
  paypal: "https://developer.paypal.com/docs",
  flutterwave: "https://flutterwave.com/docs",
  default: "https://docs.example.com",
};

export default function GatewaysManager({ initialGateways, token }: GatewaysManagerProps) {
  const [gateways, setGateways] = useState<Gateway[]>(initialGateways);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<GatewayConfig>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const handleToggle = async (gateway: Gateway) => {
    if (!confirm(`Voulez-vous vraiment ${gateway.isActive ? "désactiver" : "activer"} ${gateway.name} ?`)) {
      return;
    }

    setLoadingId(gateway.id);
    setError(null);
    try {
      const result = await paymentService.toggleGateway(gateway.id, !gateway.isActive, token);
      if (result.success) {
        setGateways(prev =>
          prev.map(g => (g.id === gateway.id ? { ...g, isActive: !g.isActive } : g))
        );
        showSuccess(`Passerelle ${gateway.name} ${!gateway.isActive ? "activée" : "désactivée"}`);
      } else {
        showError(result.message || "Erreur lors de la modification");
      }
    } catch (err) {
      showError("Erreur réseau, veuillez réessayer");
    } finally {
      setLoadingId(null);
    }
  };

  const startEdit = (gateway: Gateway) => {
    setEditingId(gateway.id);
    setEditConfig({ ...gateway.config });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditConfig({});
  };

  const saveConfig = async (gateway: Gateway) => {
    setLoadingId(gateway.id);
    setError(null);
    try {
      const result = await paymentService.updateGatewayConfig(gateway.id, editConfig, token);
      if (result.success) {
        setGateways(prev =>
          prev.map(g => (g.id === gateway.id ? { ...g, config: editConfig } : g))
        );
        showSuccess(`Configuration de ${gateway.name} mise à jour`);
        setEditingId(null);
      } else {
        showError(result.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      showError("Erreur réseau, veuillez réessayer");
    } finally {
      setLoadingId(null);
    }
  };

  const renderConfigFields = useCallback((gateway: Gateway) => {
    const fields = getConfigFields(gateway.code);
    return fields.map(field => (
      <div key={field.key} className="mb-3">
        <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
          {field.label}
        </label>
        {field.type === "select" && field.options ? (
          <select
            value={editConfig[field.key] as string || ""}
            onChange={(e) => setEditConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {field.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            value={editConfig[field.key] as string || ""}
            onChange={(e) => setEditConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        )}
      </div>
    ));
  }, [editConfig]);

  const maskSensitiveValue = (key: string, value: unknown): string => {
    if (typeof value !== "string") return value?.toString() || "—";
    const sensitiveKeys = ["secretKey", "clientSecret", "encryptionKey", "secret", "webhookSecret"];
    if (sensitiveKeys.includes(key) || value.includes("sk_") || value.includes("secret")) {
      return "••••••••";
    }
    return value || "—";
  };

  if (gateways.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-black italic mb-2">Aucune passerelle configurée</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Commencez par ajouter une passerelle de paiement.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gateways.map((gateway) => (
          <div
            key={gateway.id}
            className={`bg-[var(--card-bg)] border rounded-2xl overflow-hidden transition-all ${
              gateway.isActive
                ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                : "border-[var(--border)] opacity-75"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-3">
                {gateway.logo ? (
                  <div className="relative h-8 w-auto min-w-[32px]">
                    <Image
                      src={gateway.logo}
                      alt={gateway.name}
                      width={32}
                      height={32}
                      className="object-contain"
                      unoptimized={gateway.logo.includes("wikimedia")}
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-[var(--accent)]/10 rounded-xl">
                    <CreditCard size={20} className="text-[var(--accent)]" />
                  </div>
                )}
                <div>
                  <h3 className="font-black">{gateway.name}</h3>
                  <span className="text-[8px] font-mono text-[var(--foreground-muted)] uppercase">
                    {gateway.code}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    gateway.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                <button
                  onClick={() => handleToggle(gateway)}
                  disabled={loadingId === gateway.id}
                  className="p-1.5 rounded-lg hover:bg-[var(--accent)]/10 transition-colors"
                  aria-label={gateway.isActive ? "Désactiver" : "Activer"}
                >
                  {loadingId === gateway.id ? (
                    <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                  ) : gateway.isActive ? (
                    <PowerOff size={14} className="text-rose-500" />
                  ) : (
                    <Power size={14} className="text-emerald-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Configuration */}
            <div className="p-4">
              {editingId === gateway.id ? (
                <div className="space-y-3">
                  {renderConfigFields(gateway)}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs font-black rounded-lg border border-[var(--border)] hover:bg-[var(--accent)]/10 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => saveConfig(gateway)}
                      disabled={loadingId === gateway.id}
                      className="px-3 py-1.5 text-xs font-black rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 flex items-center gap-1 transition-colors"
                    >
                      {loadingId === gateway.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase text-[var(--foreground-muted)]">
                      Configuration
                    </span>
                    <button
                      onClick={() => startEdit(gateway)}
                      className="p-1 rounded hover:bg-[var(--accent)]/10 transition-colors"
                      aria-label="Modifier"
                    >
                      <Edit size={12} className="text-[var(--foreground-muted)]" />
                    </button>
                  </div>
                  <div className="space-y-1 text-xs font-mono text-[var(--foreground-muted)]">
                    {Object.entries(gateway.config).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className="text-[var(--foreground)]">
                          {maskSensitiveValue(key, value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[var(--background)]/50 border-t border-[var(--border)] text-right">
              <a
                href={DOCS_URLS[gateway.code] || DOCS_URLS.default}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] font-black uppercase flex items-center justify-end gap-1 text-[var(--accent)] hover:underline transition-colors"
              >
                Documentation <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}