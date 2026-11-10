import { connect } from "node:net";
import { env, isProd } from "../../config/env";

export type ScanResult = {
  clean: boolean;
  engine: string;
  signature?: string;
  detail?: string;
};

/** EICAR test file: harmless, standard way to prove a scanner is wired in. */
const EICAR_MARKERS = [
  "EICAR-STANDARD-ANTIVIRUS-TEST-FILE",
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR",
];

const EXECUTABLE_SIGNATURES: Array<{ name: string; bytes: number[]; offset?: number }> = [
  { name: "Win32.Executable", bytes: [0x4d, 0x5a] }, // "MZ"
  { name: "ELF.Executable", bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { name: "MachO.Executable", bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { name: "Shell.Script", bytes: [0x23, 0x21] }, // "#!"
];

function startsWith(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

/**
 * Always-on, dependency-free checks. Catches the EICAR test file, executables
 * hidden behind an allowed extension, macro-enabled Office documents and
 * script-bearing PDFs. This is a safety net, not a replacement for ClamAV.
 */
export function scanWithBuiltin(buffer: Buffer, mime: string): ScanResult {
  const head = buffer.subarray(0, Math.min(buffer.length, 512 * 1024));

  if (EICAR_MARKERS.some((marker) => head.includes(marker))) {
    return { clean: false, engine: "builtin", signature: "Eicar-Test-Signature", detail: "Signature de test antivirus" };
  }

  for (const signature of EXECUTABLE_SIGNATURES) {
    if (startsWith(head, signature.bytes)) {
      // A CSV/PDF/PNG must never start with an executable header.
      if (signature.name === "Shell.Script" && mime === "text/csv") continue;
      return {
        clean: false,
        engine: "builtin",
        signature: signature.name,
        detail: "Binaire exécutable déguisé en fichier autorisé",
      };
    }
  }

  const officeMime = mime.includes("spreadsheetml") || mime.includes("ms-excel");
  if (officeMime && head.includes("vbaProject.bin")) {
    return {
      clean: false,
      engine: "builtin",
      signature: "Office.Macro",
      detail: "Macro VBA embarquée dans un classeur",
    };
  }

  if (mime === "application/pdf") {
    if (head.includes("/Launch") || head.includes("/EmbeddedFile")) {
      return {
        clean: false,
        engine: "builtin",
        signature: "Pdf.SuspiciousAction",
        detail: "Action /Launch ou fichier embarqué dans le PDF",
      };
    }
  }

  return { clean: true, engine: "builtin" };
}

type ClamdResult = { status: "ok" | "found" | "error"; signature?: string; detail?: string };

/** clamd INSTREAM protocol (https://linux.die.net/man/8/clamd). */
export function clamdScan(buffer: Buffer, options: { host: string; port: number; timeoutMs?: number }): Promise<ClamdResult> {
  const { host, port, timeoutMs = 10_000 } = options;
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    let response = "";
    let settled = false;

    const finish = (result: ClamdResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs, () => finish({ status: "error", detail: "Timeout du démon antivirus" }));
    socket.on("error", (error) => finish({ status: "error", detail: error.message }));
    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");
      if (response.includes("\0") || response.includes("\n")) {
        const line = response.replace(/\0/g, "").trim();
        if (line.endsWith("OK")) return finish({ status: "ok" });
        const match = line.match(/: (.+) FOUND$/);
        if (match) return finish({ status: "found", signature: match[1] });
        finish({ status: "error", detail: line || "Réponse antivirus illisible" });
      }
    });
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      const chunkSize = 64 * 1024;
      for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const chunk = buffer.subarray(offset, offset + chunkSize);
        const length = Buffer.alloc(4);
        length.writeUInt32BE(chunk.length, 0);
        socket.write(length);
        socket.write(chunk);
      }
      socket.write(Buffer.from([0, 0, 0, 0]));
    });
  });
}

export function antivirusConfigured(): boolean {
  return env.CLAMAV_HOST.trim().length > 0;
}

/**
 * Scans an upload. When `CLAMAV_HOST` is set the daemon is authoritative;
 * an unreachable daemon fails closed in production (`AV_FAIL_CLOSED`).
 * Without a daemon the built-in engine still runs.
 */
export async function scanUpload(buffer: Buffer, mime: string): Promise<ScanResult> {
  const builtin = scanWithBuiltin(buffer, mime);
  if (!builtin.clean) return builtin;

  if (!antivirusConfigured()) return builtin;

  const result = await clamdScan(buffer, { host: env.CLAMAV_HOST, port: env.CLAMAV_PORT });
  if (result.status === "ok") return { clean: true, engine: "clamd" };
  if (result.status === "found") {
    return { clean: false, engine: "clamd", signature: result.signature ?? "Unknown", detail: "Détecté par ClamAV" };
  }

  if (env.AV_FAIL_CLOSED && isProd) {
    throw new Error(`Antivirus indisponible: ${result.detail ?? "connexion refusée"}`);
  }
  return { clean: true, engine: "builtin", detail: `ClamAV indisponible (${result.detail ?? "inconnu"}), moteur interne utilisé` };
}

/** Pure helper so quota rules stay unit-testable. */
export function evaluateQuota(usedBytes: number, fileSize: number, limitBytes: number) {
  const next = usedBytes + fileSize;
  return {
    allowed: next <= limitBytes,
    usedBytes,
    limitBytes,
    remainingBytes: Math.max(0, limitBytes - usedBytes),
    percent: limitBytes > 0 ? Math.min(100, Math.round((next / limitBytes) * 100)) : 100,
  };
}
