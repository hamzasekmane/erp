import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { chargilyBaseUrl, verifySignature } from "./chargily.client";
import { fromProviderAmount, toProviderAmount } from "./chargily.service";

const SECRET = "test_sk_1234567890abcdef";

describe("Chargily client", () => {
  it("uses the sandbox endpoint in test mode and the live endpoint otherwise", () => {
    expect(chargilyBaseUrl("test")).toBe("https://pay.chargily.net/test/api/v2");
    expect(chargilyBaseUrl("live")).toBe("https://pay.chargily.net/api/v2");
  });

  it("accepts a signature computed over the raw payload", () => {
    const payload = JSON.stringify({ entity: "event", type: "checkout.paid", data: { id: "ch_1", amount: 1200 } });
    const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
    expect(verifySignature(payload, signature, SECRET)).toBe(true);
    expect(verifySignature(Buffer.from(payload), signature.toUpperCase(), SECRET)).toBe(true);
  });

  it("rejects tampered payloads, wrong keys and missing signatures", () => {
    const payload = JSON.stringify({ type: "checkout.paid", data: { id: "ch_1", amount: 1200 } });
    const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
    expect(verifySignature(payload.replace("1200", "100"), signature, SECRET)).toBe(false);
    expect(verifySignature(payload, signature, "test_sk_other")).toBe(false);
    expect(verifySignature(payload, undefined, SECRET)).toBe(false);
    expect(verifySignature(payload, "", SECRET)).toBe(false);
    expect(verifySignature(payload, "deadbeef", SECRET)).toBe(false);
  });
});

describe("Chargily amount conversion", () => {
  it("converts minor units to whole dinars and back", () => {
    expect(toProviderAmount(125_000)).toBe(1250);
    // invoice balances with centimes are rounded up so a full checkout clears them
    expect(toProviderAmount(78_540)).toBe(786);
    expect(toProviderAmount(99)).toBe(1);
    expect(fromProviderAmount(1250)).toBe(125_000);
    expect(fromProviderAmount(undefined)).toBe(0);
  });
});
