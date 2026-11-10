import { describe, expect, it } from "vitest";
import { evaluateQuota, scanWithBuiltin } from "./antivirus";

const EICAR = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

describe("built-in antivirus engine", () => {
  it("blocks the EICAR test file whatever the extension", () => {
    const result = scanWithBuiltin(Buffer.from(EICAR, "utf8"), "text/csv");
    expect(result.clean).toBe(false);
    expect(result.signature).toBe("Eicar-Test-Signature");
  });

  it("blocks a Windows executable disguised as a PDF", () => {
    const buffer = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(120, 0x90)]);
    expect(scanWithBuiltin(buffer, "application/pdf")).toMatchObject({ clean: false, signature: "Win32.Executable" });
  });

  it("blocks ELF payloads", () => {
    const buffer = Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.alloc(64)]);
    expect(scanWithBuiltin(buffer, "image/png").clean).toBe(false);
  });

  it("blocks macro-enabled spreadsheets", () => {
    const buffer = Buffer.concat([Buffer.from("PK\u0003\u0004", "binary"), Buffer.from("xl/vbaProject.bin"), Buffer.alloc(32)]);
    const result = scanWithBuiltin(buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(result).toMatchObject({ clean: false, signature: "Office.Macro" });
  });

  it("blocks PDFs with launch actions or embedded files", () => {
    expect(scanWithBuiltin(Buffer.from("%PDF-1.7 /EmbeddedFile stream"), "application/pdf").clean).toBe(false);
    expect(scanWithBuiltin(Buffer.from("%PDF-1.7 /Launch"), "application/pdf").clean).toBe(false);
  });

  it("accepts genuine invoices, images and CSV exports", () => {
    expect(scanWithBuiltin(Buffer.from("%PDF-1.7\n1 0 obj<<>>endobj\ntrailer<<>>", "utf8"), "application/pdf").clean).toBe(true);
    expect(scanWithBuiltin(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png").clean).toBe(true);
    expect(scanWithBuiltin(Buffer.from("client;montant\nACME;1200\n", "utf8"), "text/csv").clean).toBe(true);
  });
});

describe("storage quota", () => {
  it("allows an upload that fits", () => {
    const quota = evaluateQuota(100, 50, 1000);
    expect(quota.allowed).toBe(true);
    expect(quota.remainingBytes).toBe(900);
    expect(quota.percent).toBe(15);
  });

  it("rejects an upload that exceeds the plan", () => {
    const quota = evaluateQuota(950, 100, 1000);
    expect(quota.allowed).toBe(false);
    expect(quota.remainingBytes).toBe(50);
  });

  it("reports 100% when no quota is known", () => {
    expect(evaluateQuota(0, 1, 0).percent).toBe(100);
  });
});
