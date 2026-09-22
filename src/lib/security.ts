/**
 * Shared security helpers for Limitless.
 *
 * Adapted from the uploaded security review (security-middleware.js /
 * content-moderation.js) to this stack: the Express/JWT/CSRF pieces are
 * handled by the platform (managed auth cookies, same-origin server
 * functions), so what lives here is the part that is ours to enforce —
 * upload validation, input limits, and prompt/content screening.
 */

export const PDF_MAX_BYTES = 25 * 1024 * 1024; // 25 MB — mirrors the server cap
export const MAX_SOURCE_CHARS = 120_000;
export const MAX_MESSAGE_CHARS = 8_000;

export type ValidationResult = { ok: true } | { ok: false; error: string };

/** Strip anything that could be abused in a path or rendered as markup. */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/]+/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/[^\w.\-() ]+/g, "")
    .slice(0, 120)
    .trim() || "document.pdf";
}

/**
 * Validates an uploaded PDF by its actual bytes, not its declared type:
 * size cap, %PDF- magic header, and a scan for embedded active content.
 */
export async function validatePdfFile(file: File): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > PDF_MAX_BYTES) {
    return { ok: false, error: "PDF is too large (max 25 MB)." };
  }
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return { ok: false, error: "Please upload a PDF file." };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  // Magic bytes: a real PDF starts with "%PDF-" (allow a tiny leading offset).
  const head = latin1(buffer.subarray(0, 1024));
  if (!head.includes("%PDF-")) {
    return { ok: false, error: "That file doesn't look like a valid PDF." };
  }

  // Embedded JavaScript is rare in study material and a common attack vector.
  const body = latin1(buffer);
  if (/\/JavaScript\b|\/JS\b|\/OpenAction\b|\/Launch\b/.test(body)) {
    return {
      ok: false,
      error: "This PDF contains embedded scripts and can't be processed.",
    };
  }

  return { ok: true };
}

function latin1(bytes: Uint8Array): string {
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Content screening                                                    */
/* ------------------------------------------------------------------ */

const FLAG_PATTERNS: RegExp[] = [
  /\b(hack|exploit|bypass)\b.{0,20}\b(account|server|auth|payment|database)\b/i,
  /ignore\s+(all|any|previous|the above|prior)\s+instructions/i,
  /disregard\s+(all|any|previous|the above)\s+(instructions|rules)/i,
  /\b(reveal|print|show|repeat)\b.{0,20}\b(system prompt|your instructions)\b/i,
  /\bsystem prompt\b/i,
  /\byou are now\b.{0,30}\b(dan|jailbroken|unrestricted)\b/i,
];

export type ModerationResult = { flagged: false } | { flagged: true; reason: string };

/**
 * Fast local screening for prompt injection and abusive length. A first
 * pass, deliberately not the only defence — the model itself is instructed
 * to stay in role and every AI call is also rate limited per account.
 */
export function screenText(text: string, maxChars = MAX_MESSAGE_CHARS): ModerationResult {
  if (text.length > maxChars) {
    return { flagged: true, reason: "excessive_length" };
  }
  for (const pattern of FLAG_PATTERNS) {
    if (pattern.test(text)) {
      return { flagged: true, reason: "prompt_injection" };
    }
  }
  return { flagged: false };
}

export const BLOCKED_MESSAGE =
  "That request couldn't be processed. Please rephrase and try again.";

/** Throws a user-safe error when the text is flagged. */
export function assertClean(text: string, maxChars = MAX_MESSAGE_CHARS): void {
  const result = screenText(text, maxChars);
  if (result.flagged) {
    throw new Error(
      result.reason === "excessive_length"
        ? "That input is too long — please shorten it."
        : BLOCKED_MESSAGE,
    );
  }
}
