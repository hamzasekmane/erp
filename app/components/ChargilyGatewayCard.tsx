"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Copy, CreditCard, Loader2, Save, ShieldCheck } from "lucide-react";
import { apiBaseUrl } from "@/app/lib/apiBase";

type ChargilyStatus = {
  configured: boolean;
  mode: "test" | "live";
  source: "tenant" | "platform" | "none";
  webhookPath: string;
  secretsEncryption: boolean;
};

type Props = {
  token: string;
  initialStatus: ChargilyStatus | null;
};

const FALLBACK: ChargilyStatus = {
  configured: false,
  mode: "test",
  source: "none",
  webhookPath: "/api/payments/chargily/webhook",
  secretsEncryption: false,
};

export default function ChargilyGatewayCard({ token, initialStatus }: Props) {
  const [status, setStatus] = useState<ChargilyStatus>(initialStatus ?? FALLBACK);
  const [mode, setMode] = useState<"test" | "live">((initialStatus ?? FALLBACK).mode);
  const [secretKey, setSecretKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const webhookUrl = `${origin}${status.webhookPath}`;

  const refresh = async () => {
    const res = await fetch(`${apiBaseUrl()}/payments/chargily/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return;
    const payload = await res.json().catch(() => null);
    if (payload?.data) {
      setStatus(payload.data as ChargilyStatus);
      setMode((payload.data as ChargilyStatus).mode);
    }
  };

  const save = async () => {
    if (!secretKey.trim()) {
      setMessage({ type: "error", text: "Collez la clé secrète Chargily (test_… ou live_…)." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBaseUrl()}/payments/settings/gateways/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: "chargily",
          name: "Chargily Pay",
          isActive: true,
          config: { mode },
          secrets: { secret_key: secretKey.trim() },
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage({ type: "error", text: payload?.message || "Enregistrement impossible." });
        return;
      }
      setSecretKey("");
      await refresh();
      setMessage({ type: "success", text: "Clé enregistrée et chiffrée. Paiement en ligne activé." });
    } catch {
      setMessage({ type: "error", text: "Impossible de contacter l'API." });
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CreditCard size={18} className="text-emerald-500" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-widest">Chargily Pay · CIB &amp; EDAHABIA</h2>
          <p className="text-[11px] text-[var(--foreground-muted)] font-medium">
            Encaissement en ligne des factures (dinars algériens).
          </p>
        </div>
        <span
          className={`ms-auto text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            status.configured
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-500 border-amber-500/30"
          }`}
        >
          {status.configured ? `Activé · ${status.mode}` : "Non configuré"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
            Environnement
          </span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value === "live" ? "live" : "test")}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs font-bold"
          >
            <option value="test">Test (bac à sable)</option>
            <option value="live">Production</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
            Clé secrète API
          </span>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={status.configured ? "•••••••• (déjà enregistrée)" : mode === "live" ? "live_…" : "test_…"}
            autoComplete="new-password"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-xs font-mono"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
          URL de webhook à déclarer dans le tableau de bord Chargily
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-[10px] break-all font-mono flex-1 min-w-[200px]">{webhookUrl}</code>
          <button
            type="button"
            onClick={copyWebhook}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold hover:border-[var(--accent)]/50"
          >
            {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <p className="text-[10px] text-[var(--foreground-muted)] flex items-start gap-1.5">
          <ShieldCheck size={12} className="mt-0.5 shrink-0 text-emerald-500" />
          La signature HMAC-SHA256 de chaque événement est vérifiée sur le corps brut avant tout enregistrement.
          {status.source === "platform" && " Clé actuellement fournie par la configuration serveur."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--background)] disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] hover:text-[var(--accent)]"
        >
          Actualiser le statut
        </button>
      </div>

      {message && (
        <p
          className={`flex items-start gap-2 text-[10px] font-bold ${
            message.type === "success" ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={12} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
          )}
          {message.text}
        </p>
      )}
    </section>
  );
}
