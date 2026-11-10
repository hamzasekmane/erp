import { createHmac, timingSafeEqual } from "node:crypto";

/** Chargily Pay v2 API client (EDAHABIA / CIB — Algeria). */
export type ChargilyMode = "test" | "live";

export interface CreateCheckoutInput {
  amount: number; // integer DZD (Chargily has no minor unit)
  currency?: string;
  payment_method?: "edahabia" | "cib";
  success_url: string;
  failure_url: string;
  description?: string;
  locale?: "ar" | "en" | "fr";
  metadata?: Record<string, unknown>;
  webhook_endpoint?: string;
  pass_fees_to_customer?: boolean;
}

export interface ChargilyCheckout {
  id: string;
  entity?: string;
  amount: number;
  currency: string;
  status: string;
  checkout_url: string;
  payment_method?: string | null;
  success_url?: string;
  failure_url?: string;
  metadata?: unknown;
  created_at?: string;
  updated_at?: string;
}

export class ChargilyError extends Error {
  constructor(message: string, readonly status?: number, readonly details?: unknown) {
    super(message);
    this.name = "ChargilyError";
  }
}

const TIMEOUT_MS = 15_000;

export function chargilyBaseUrl(mode: ChargilyMode): string {
  return mode === "live" ? "https://pay.chargily.net/api/v2" : "https://pay.chargily.net/test/api/v2";
}

async function request<T>(secretKey: string, mode: ChargilyMode, path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${chargilyBaseUrl(mode)}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ChargilyError(
      `Chargily indisponible: ${error instanceof Error ? error.message : "network error"}`,
      0,
    );
  }

  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new ChargilyError(`Chargily a répondu ${response.status}`, response.status, body);
  }
  return body as T;
}

export function createCheckout(secretKey: string, mode: ChargilyMode, input: CreateCheckoutInput): Promise<ChargilyCheckout> {
  return request<ChargilyCheckout>(secretKey, mode, "/checkouts", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency ?? "dzd",
      ...(input.payment_method ? { payment_method: input.payment_method } : {}),
      success_url: input.success_url,
      failure_url: input.failure_url,
      ...(input.description ? { description: input.description } : {}),
      ...(input.locale ? { locale: input.locale } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.webhook_endpoint ? { webhook_endpoint: input.webhook_endpoint } : {}),
      ...(input.pass_fees_to_customer ? { pass_fees_to_customer: true } : {}),
    }),
  });
}

export function getCheckout(secretKey: string, mode: ChargilyMode, id: string): Promise<ChargilyCheckout> {
  return request<ChargilyCheckout>(secretKey, mode, `/checkouts/${encodeURIComponent(id)}`);
}

/**
 * Webhook authenticity: hex HMAC-SHA256 of the **raw** body, keyed with the API
 * secret key, sent in the `signature` header.
 */
export function verifySignature(rawBody: string | Buffer, signature: string | undefined | null, secretKey: string): boolean {
  if (!signature || !secretKey) return false;
  const expected = createHmac("sha256", secretKey).update(rawBody).digest("hex");
  const received = signature.trim().toLowerCase();
  if (received.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}
