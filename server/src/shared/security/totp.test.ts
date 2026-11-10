import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, generateTotpSecret, hotp, otpauthUrl, totpCode, verifyTotp } from "./totp";

// RFC 6238 appendix B test vector (SHA-1, 8 digits, secret "12345678901234567890").
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "utf8"));

describe("base32", () => {
  it("round-trips random secrets", () => {
    for (const size of [10, 20, 32]) {
      const original = Buffer.from(Array.from({ length: size }, (_, i) => (i * 37 + 11) % 256));
      expect(base32Decode(base32Encode(original)).equals(original)).toBe(true);
    }
  });

  it("generates a 32-character secret by default", () => {
    expect(generateTotpSecret()).toHaveLength(32);
  });

  it("rejects invalid characters", () => {
    expect(() => base32Decode("ABC1")).toThrow();
  });
});

describe("TOTP (RFC 6238)", () => {
  it("matches the reference vectors", () => {
    expect(hotp(RFC_SECRET, 1, 8)).toBe("94287082");
    expect(totpCode(RFC_SECRET, 59_000, 30, 8)).toBe("94287082");
    expect(totpCode(RFC_SECRET, 1_111_111_109_000, 30, 8)).toBe("07081804");
    expect(totpCode(RFC_SECRET, 2_000_000_000_000, 30, 8)).toBe("69279037");
  });

  it("accepts the current code and ±1 step of drift", () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    expect(verifyTotp(secret, totpCode(secret, now), { now })).toBe(true);
    expect(verifyTotp(secret, totpCode(secret, now - 30_000), { now })).toBe(true);
    expect(verifyTotp(secret, totpCode(secret, now + 30_000), { now })).toBe(true);
    expect(verifyTotp(secret, totpCode(secret, now - 90_000), { now })).toBe(false);
  });

  it("rejects malformed or wrong codes", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "12345")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "000000", { now: 1_700_000_000_000 })).toBe(false);
    expect(verifyTotp("not-base32!", "123456")).toBe(false);
  });

  it("builds a scannable otpauth URI", () => {
    const url = otpauthUrl({ secret: "JBSWY3DPEHPK3PXP", account: "admin@erp.local", issuer: "Velora ERP" });
    expect(url.startsWith("otpauth://totp/Velora%20ERP%3Aadmin%40erp.local?")).toBe(true);
    expect(url).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(url).toContain("period=30");
  });
});
