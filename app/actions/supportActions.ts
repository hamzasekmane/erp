"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiBaseUrl } from "@/app/lib/apiBase";

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

async function supportRequest(path: string, init?: RequestInit) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return { ok: false, status: 401, body: { message: "Session expirée, reconnectez-vous." } as Record<string, unknown> };
  }
  try {
    const res = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { ok: res.ok, status: res.status, body: body ?? {} };
  } catch (error) {
    return { ok: false, status: 0, body: { message: error instanceof Error ? error.message : "Erreur réseau" } as Record<string, unknown> };
  }
}

export async function listTicketsAction(limit = 5): Promise<{ success: boolean; tickets: SupportTicket[]; message?: string }> {
  const { ok, body } = await supportRequest(`/support/tickets?limit=${limit}`);
  const rows = Array.isArray(body.data) ? (body.data as Record<string, unknown>[]) : [];
  return {
    success: ok,
    message: ok ? undefined : String(body.message ?? "Impossible de charger les tickets."),
    tickets: rows.map((row) => ({
      id: String(row.id ?? ""),
      subject: String(row.subject ?? ""),
      description: String(row.description ?? ""),
      category: String(row.category ?? "other"),
      priority: String(row.priority ?? "medium"),
      status: String(row.status ?? "open"),
      createdAt: String(row.createdAt ?? ""),
    })),
  };
}

export async function createTicketAction(input: { subject: string; description: string; priority: string; category?: string }): Promise<{ success: boolean; message?: string }> {
  if (!input.subject.trim()) return { success: false, message: "Le sujet est obligatoire." };
  const { ok, body } = await supportRequest("/support/tickets", {
    method: "POST",
    body: JSON.stringify({
      subject: input.subject.trim(),
      description: input.description.trim(),
      priority: input.priority,
      category: input.category ?? "technical",
    }),
  });
  if (ok) revalidatePath("/dashboard/support/technical");
  return { success: ok, message: ok ? "Ticket créé" : String(body.message ?? "Création impossible.") };
}
