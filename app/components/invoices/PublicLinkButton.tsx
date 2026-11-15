"use client";

import { useState } from "react";
import { Link2, Loader2, Copy, Check, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { createPublicLinkAction, revokePublicLinksAction } from "@/app/actions/publicLinkActions";

/**
 * Mints and revokes public share links for an invoice.
 *
 * The token is shown once, with an explicit warning: only its hash is stored,
 * so it cannot be displayed again. Revoking invalidates every outstanding link
 * for the invoice at once.
 */
export default function PublicLinkButton({
  invoiceId,
  invoiceNumber,
  className = "p-2.5 bg-white/5 hover:bg-indigo-500/20 rounded-xl transition-all",
}: {
  invoiceId: string;
  invoiceNumber: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [link, setLink] = useState<{ token: string; url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const absoluteUrl = link ? `${typeof window === "undefined" ? "" : window.location.origin}${link.url}` : "";

  async function handleCreate() {
    setCreating(true);
    setCopied(false);
    try {
      const result = await createPublicLinkAction(invoiceId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setLink({ token: result.token, url: result.url, expiresAt: result.expiresAt });
      toast.success("Lien public créé");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    try {
      const result = await revokePublicLinksAction(invoiceId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setLink(null);
      setOpen(false);
      toast.success(result.revoked === 0 ? "Aucun lien actif" : `${result.revoked} lien(s) révoqué(s)`);
    } finally {
      setRevoking(false);
    }
  }

  async function handleCopy() {
    if (!absoluteUrl) return;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      toast.success("Lien copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible — sélectionnez le lien manuellement");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={className}
        aria-label={`Partager la facture ${invoiceNumber} par lien public`}
        aria-expanded={open}
        title="Créer un lien public"
      >
        <Link2 size={16} className="text-zinc-400" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Lien public pour la facture ${invoiceNumber}`}
          className="absolute end-0 z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-2xl"
        >
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
            Lien de partage
          </p>
          <p className="mb-3 text-xs leading-relaxed text-[var(--foreground-muted)]">
            Lien expirant, révocable, autorisé par un jeton. Le jeton n&apos;est affiché qu&apos;une fois.
          </p>

          {link ? (
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase text-[var(--foreground-muted)]" htmlFor="public-link-url">
                Lien (expire le {new Date(link.expiresAt).toLocaleDateString()})
              </label>
              <input
                id="public-link-url"
                readOnly
                value={absoluteUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-xs"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-900"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} Copier
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 px-3 py-2 text-xs font-bold text-rose-400 disabled:opacity-50"
                >
                  {revoking ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />} Révoquer
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-900 disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />} Générer un lien
            </button>
          )}
        </div>
      )}
    </div>
  );
}
