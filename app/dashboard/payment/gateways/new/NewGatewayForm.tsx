// app/dashboard/payment/gateways/new/NewGatewayForm.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { paymentService } from "@/app/services/paymentServices";
import type { GatewayConfig } from "@/app/types/payment";
import { CreditCard, Loader2, AlertCircle, Check, ExternalLink } from "lucide-react";

interface GatewayOption {
  code: string;
  name: string;
  logo?: string;
}

interface NewGatewayFormProps {
  token: string;
  supportedGateways: GatewayOption[];
}

interface ConfigField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

// Documentation URLs for each gateway
const DOCS_URLS: Record<string, string> = {
  stripe: "https://docs.stripe.com",
  paypal: "https://developer.paypal.com/docs",
  flutterwave: "https://flutterwave.com/docs",
  paystack: "https://paystack.com/docs",
  mercadopago: "https://www.mercadopago.com/developers",
  default: "https://docs.example.com",
};

const CONFIG_FIELDS: Record<string, ConfigField[]> = {
  stripe: [
    { key: "apiKey", label: "Clé API publique", type: "text", required: true, placeholder: "pk_test_..." },
    { key: "secretKey", label: "Clé secrète", type: "password", required: true, placeholder: "sk_test_..." },
    { key: "webhookSecret", label: "Secret webhook", type: "password", required: false, placeholder: "whsec_..." },
  ],
  paypal: [
    { key: "clientId", label: "Client ID", type: "text", required: true, placeholder: "AZxxx..." },
    { key: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "ELxxx..." },
    { key: "mode", label: "Mode", type: "select", required: true, options: ["sandbox", "live"] },
  ],
  flutterwave: [
    { key: "publicKey", label: "Clé publique", type: "text", required: true, placeholder: "FLWPUBK-..." },
    { key: "secretKey", label: "Clé secrète", type: "password", required: true, placeholder: "FLWSECK-..." },
    { key: "encryptionKey", label: "Clé de chiffrement", type: "password", required: false, placeholder: "FLWSECK-..." },
  ],
  paystack: [
    { key: "publicKey", label: "Clé publique", type: "text", required: true, placeholder: "pk_live_..." },
    { key: "secretKey", label: "Clé secrète", type: "password", required: true, placeholder: "sk_live_..." },
  ],
  mercadopago: [
    { key: "accessToken", label: "Access Token", type: "password", required: true, placeholder: "APP_USR-..." },
    { key: "publicKey", label: "Clé publique", type: "text", required: true, placeholder: "APP_USR-..." },
  ],
};

export default function NewGatewayForm({ token, supportedGateways }: NewGatewayFormProps) {
  const router = useRouter();
  const [selectedGateway, setSelectedGateway] = useState<GatewayOption | null>(null);
  const [config, setConfig] = useState<GatewayConfig>({});
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleGatewaySelect = (gateway: GatewayOption) => {
    setSelectedGateway(gateway);
    const fields = CONFIG_FIELDS[gateway.code] || [];
    const defaultConfig: GatewayConfig = {};
    fields.forEach(field => {
      if (field.type === "select" && field.options && field.options.length > 0) {
        defaultConfig[field.key] = field.options[0];
      } else {
        defaultConfig[field.key] = "";
      }
    });
    setConfig(defaultConfig);
    setValidationErrors({});
    setError(null);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    // Clear validation error for this field if it exists
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!selectedGateway) {
      setError("Veuillez sélectionner une passerelle");
      return false;
    }

    const fields = CONFIG_FIELDS[selectedGateway.code] || [];
    const errors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.required && !config[field.key]) {
        errors[field.key] = `Le champ "${field.label}" est requis`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.setupGateway(token, {
        code: selectedGateway!.code,
        config,
        isActive,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/payment/gateways");
        }, 1500);
      } else {
        setError(result.error || result.message || "Erreur lors de la création de la passerelle");
      }
    } catch (err) {
      console.error("Setup gateway error:", err);
      setError("Erreur réseau, veuillez réessayer");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-12 text-center">
        <Check className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
        <h2 className="text-xl font-black mb-2">Passerelle ajoutée !</h2>
        <p className="text-sm text-[var(--foreground-muted)]">
          Redirection vers la liste des passerelles...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Choose Gateway */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-[var(--foreground-muted)] mb-3">
            1. Choisissez un fournisseur
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {supportedGateways.map((gateway) => (
              <button
                key={gateway.code}
                type="button"
                onClick={() => handleGatewaySelect(gateway)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedGateway?.code === gateway.code
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50"
                }`}
              >
                {gateway.logo ? (
                  <div className="relative h-8 w-full mb-2">
                    <Image
                      src={gateway.logo}
                      alt={gateway.name}
                      width={60}
                      height={32}
                      className="object-contain mx-auto"
                      unoptimized={gateway.logo.includes("wikimedia") || gateway.logo.includes("flutterwave")}
                    />
                  </div>
                ) : (
                  <CreditCard size={24} className="mx-auto mb-2 text-[var(--foreground-muted)]" />
                )}
                <span className="text-xs font-black block">{gateway.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Configuration */}
        {selectedGateway && (
          <div className="animate-in fade-in duration-300">
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--foreground-muted)] mb-3">
              2. Configuration {selectedGateway.name}
            </label>
            <div className="space-y-4">
              {CONFIG_FIELDS[selectedGateway.code]?.map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] font-bold mb-1">
                    {field.label}
                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={config[field.key] as string || ""}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>
                          {opt === "sandbox" ? "Sandbox (test)" : opt === "live" ? "Live (production)" : opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={config[field.key] as string || ""}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-2 bg-[var(--background)] border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${
                        validationErrors[field.key] ? "border-rose-500" : "border-[var(--border)]"
                      }`}
                    />
                  )}
                  {validationErrors[field.key] && (
                    <p className="text-[9px] text-rose-500 mt-1">{validationErrors[field.key]}</p>
                  )}
                  {field.key === "secretKey" && (
                    <p className="text-[9px] text-[var(--foreground-muted)] mt-1">
                      Ces informations sont chiffrées et ne seront jamais affichées en clair.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Activation toggle */}
            <div className="mt-6 flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
              <div>
                <span className="text-sm font-black">Activer immédiatement</span>
                <p className="text-[10px] text-[var(--foreground-muted)]">
                  La passerelle sera disponible pour les paiements dès sa création.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                aria-label={isActive ? "Désactiver" : "Activer"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
                <span
                  className={`absolute inset-0 rounded-full transition-colors ${
                    isActive ? "bg-emerald-500" : "bg-[var(--border)]"
                  }`}
                />
              </button>
            </div>

            {/* Error display */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 rounded-xl border border-[var(--border)] text-sm font-black hover:bg-[var(--accent)]/10 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-black hover:bg-[var(--accent)]/90 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? "Création..." : "Ajouter la passerelle"}
              </button>
            </div>

            {/* Documentation hint - with correct URL */}
            <div className="mt-4 text-center">
              <a
                href={DOCS_URLS[selectedGateway.code] || DOCS_URLS.default}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-[var(--accent)] hover:underline inline-flex items-center gap-1 transition-colors"
              >
                Consulter la documentation {selectedGateway.name} <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}