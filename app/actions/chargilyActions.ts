"use server";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type CheckoutState = { error?: string };

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: { checkoutUrl?: string; checkout_url?: string };
};

/**
 * Creates a Chargily Pay checkout for an invoice and sends the customer to the
 * gateway page. The invoice is only settled later — by the signed webhook or by
 * the server-side refresh when the customer comes back.
 */
export async function createChargilyCheckoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const method = formData.get("method") === "cib" ? "cib" : "edahabia";
  if (!invoiceId) return { error: "Facture introuvable." };

  const token = (await cookies()).get("token")?.value;
  if (!token) return { error: "Session expirée, reconnectez-vous." };

  let checkoutUrl: string | undefined;
  try {
    const res = await fetch(`${apiBaseUrl()}/payments/chargily/checkouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ invoiceId, method }),
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as ApiEnvelope | null;
    if (!res.ok) {
      return { error: payload?.message || "La passerelle a refusé la demande." };
    }
    checkoutUrl = payload?.data?.checkoutUrl ?? payload?.data?.checkout_url;
    if (!checkoutUrl) return { error: "Réponse de la passerelle incomplète." };
  } catch {
    return { error: "Impossible de contacter la passerelle de paiement." };
  }

  redirect(checkoutUrl);
}

export type RefreshState = { status?: string; error?: string };

/** Server-side status re-check used when the customer returns from Chargily. */
export async function refreshInvoicePaymentsAction(invoiceId: string): Promise<RefreshState> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return { error: "Session expirée." };
  try {
    const res = await fetch(`${apiBaseUrl()}/payments/chargily/invoices/${invoiceId}/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as
      | { success?: boolean; message?: string; data?: { paid?: boolean } }
      | null;
    if (!res.ok) return { error: payload?.message || "Vérification impossible." };
    return { status: payload?.data?.paid ? "paid" : "pending" };
  } catch {
    return { error: "Vérification impossible." };
  }
}
