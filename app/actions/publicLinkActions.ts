"use server";

import { cookies } from "next/headers";
import { invoiceService } from "@/app/services/invoice.service";

/**
 * Mints a public share link for an invoice.
 *
 * The token is returned to the caller ONCE and is never persisted in a readable
 * form anywhere (only its SHA-256 hash is stored). If the user loses it, the
 * correct remedy is to mint a new link and revoke the old ones.
 */
export async function createPublicLinkAction(
  invoiceId: string,
  expiresInDays?: number,
): Promise<
  | { success: true; token: string; url: string; expiresAt: string }
  | { success: false; message: string }
> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return { success: false, message: "Session expirée, veuillez vous reconnecter." };

  try {
    const link = await invoiceService.createPublicLink(invoiceId, token, expiresInDays);
    return { success: true, token: link.token, url: link.url, expiresAt: link.expiresAt };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossible de créer le lien public.",
    };
  }
}

/** Revokes every active public link for an invoice. */
export async function revokePublicLinksAction(
  invoiceId: string,
): Promise<{ success: true; revoked: number } | { success: false; message: string }> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return { success: false, message: "Session expirée, veuillez vous reconnecter." };

  try {
    const result = await invoiceService.revokePublicLinks(invoiceId, token);
    return { success: true, revoked: result.revoked };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Impossible de révoquer le lien.",
    };
  }
}
