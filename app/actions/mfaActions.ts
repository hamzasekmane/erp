"use server";

import { apiBaseUrl } from "@/app/lib/apiBase";
import { cookies } from "next/headers";

export type MfaStatusData = {
  enabled: boolean;
  pending: boolean;
  required: boolean;
  issuer: string;
  storageReady: boolean;
};

export type MfaSetupData = {
  secret: string;
  otpauthUrl: string;
  issuer: string;
  account: string;
  digits: number;
  period: number;
};

async function callApi<T>(path: string, init?: RequestInit): Promise<{ data?: T; error?: string }> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return { error: "Session expirée, reconnectez-vous." };
  try {
    const res = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
      cache: "no-store",
    });
    const payload = (await res.json().catch(() => null)) as
      | { success?: boolean; message?: string; data?: T }
      | null;
    if (!res.ok) return { error: payload?.message || "Opération refusée par le serveur." };
    return { data: payload?.data as T };
  } catch {
    return { error: "Impossible de contacter l'API." };
  }
}

export async function getMfaStatusAction(): Promise<{ data?: MfaStatusData; error?: string }> {
  return callApi<MfaStatusData>("/auth/mfa");
}

export async function mfaSetupAction(): Promise<{ data?: MfaSetupData; error?: string }> {
  return callApi<MfaSetupData>("/auth/mfa/setup", { method: "POST" });
}

export async function mfaEnableAction(code: string): Promise<{ ok?: boolean; error?: string }> {
  if (!/^\d{6}$/.test(code)) return { error: "Saisissez les 6 chiffres du code." };
  const result = await callApi<{ enabled: boolean }>("/auth/mfa/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return result.error ? { error: result.error } : { ok: true };
}

export async function mfaDisableAction(password: string, code: string): Promise<{ ok?: boolean; error?: string }> {
  if (!password) return { error: "Mot de passe requis." };
  if (!/^\d{6}$/.test(code)) return { error: "Saisissez les 6 chiffres du code." };
  const result = await callApi<{ enabled: boolean }>("/auth/mfa/disable", {
    method: "POST",
    body: JSON.stringify({ password, code }),
  });
  return result.error ? { error: result.error } : { ok: true };
}
