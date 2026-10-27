/**
 * Limitless PDF scanner — TypeScript port of `limitless-security.js` PART 1
 * (PDF scanning). Server-only: uses node:zlib + Buffer (safe on the edge
 * runtime with nodejs_compat).
 *
 * Context-aware patterns: each keyword must appear the way a real PDF
 * action/dictionary would use it, which keeps accidental byte sequences from
 * matching. Binary stream bodies are skipped — they are noise and cause
 * accidental matches.
 */

import { inflateSync } from "node:zlib";

export type ScanFinding = { id: string; severity: "block" | "review" };
export type PdfScanResult = { verdict: "allow" | "review" | "block"; findings: ScanFinding[] };

export const PDF_RULES: { id: string; severity: "block" | "review"; re: RegExp }[] = [
  { id: "pdf_javascript", severity: "block",
    re: /\/S\s*\/JavaScript(?![A-Za-z0-9])|\/JS\s*(\(|<|\d+\s+\d+\s+R)|\/JavaScript\s*(\d+\s+\d+\s+R|<<)/ },
  { id: "pdf_launch_action", severity: "block", re: /\/S\s*\/Launch(?![A-Za-z0-9])/ },
  { id: "pdf_submit_or_import", severity: "block", re: /\/S\s*\/(SubmitForm|ImportData)(?![A-Za-z0-9])/ },
  { id: "pdf_rich_media", severity: "review", re: /\/RichMedia(?![A-Za-z0-9])/ },
  { id: "pdf_embedded_file", severity: "review", re: /\/EmbeddedFile(?![A-Za-z0-9])/ },
  { id: "pdf_auto_action", severity: "review", re: /\/(OpenAction|AA)\s*(<<|\[|\d+\s+\d+\s+R)/ },
  { id: "pdf_remote_goto", severity: "review", re: /\/S\s*\/(GoToR|GoToE)(?![A-Za-z0-9])/ },
  { id: "pdf_forms", severity: "review", re: /\/(AcroForm|XFA)(?![A-Za-z0-9])/ },
  { id: "pdf_encrypted", severity: "review", re: /\/Encrypt(?![A-Za-z0-9])/ },
  // Filters this scanner cannot decode (Flate, ASCII85, ASCIIHex it can): content behind them is uninspected.
  { id: "pdf_uninspectable_filter", severity: "review", re: /\/(LZWDecode|Crypt)(?![A-Za-z0-9])/ },
];

type Limits = { maxStreams?: number; maxPerStream?: number; maxTotal?: number };

function decodeAscii85(buf: Buffer, maxBytes: number): Buffer {
  let str = buf.toString("latin1").replace(/\s+/g, "");
  if (str.startsWith("<~")) str = str.slice(2);
  const end = str.indexOf("~>");
  if (end !== -1) str = str.slice(0, end);
  if (str.length * 0.8 + 8 > maxBytes) {
    const e = new RangeError("too large") as Error & { code?: string };
    e.code = "ERR_BUFFER_TOO_LARGE";
    throw e;
  }

  const out = Buffer.alloc(Math.ceil((str.length * 4) / 5) + 8);
  let w = 0, n = 0, v = 0;
  const flush = (count: number, value: number) => {
    const bytes = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
    for (let i = 0; i < count; i++) out[w++] = bytes[i];
  };
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "z" && n === 0) { w += 4; continue; }
    const c = str.charCodeAt(i) - 33;
    if (c < 0 || c > 84) throw new Error("invalid ascii85");
    v = v * 85 + c;
    if (++n === 5) { flush(4, v); n = 0; v = 0; }
  }
  if (n > 1) {
    // partial final group
    for (let i = n; i < 5; i++) v = v * 85 + 84;
    flush(n - 1, v);
  }
  return out.subarray(0, w);
}

function decodeAsciiHex(buf: Buffer): Buffer {
  let str = buf.toString("latin1").replace(/\s+/g, "");
  const end = str.indexOf(">");
  if (end !== -1) str = str.slice(0, end);
  if (str.length % 2) str += "0";
  return Buffer.from(str, "hex");
}

/** True when a buffer is mostly printable ASCII (content streams, dictionaries). */
function looksTextual(buf: Buffer): boolean {
  const n = Math.min(buf.length, 8192);
  if (n === 0) return false;
  let printable = 0;
  for (let i = 0; i < n; i++) {
    const b = buf[i];
    if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126)) printable++;
  }
  return printable / n >= 0.9;
}

/**
 * Splits the file into the "structure" (everything outside stream bodies) and
 * the stream bodies. Each body yields candidates: the raw body plus up to 4
 * decoded layers (Flate/ASCII85/ASCIIHex, defeats stacked-filter hiding).
 * Everything is size-bounded.
 */
function splitStreams(latin1: string, limits: Limits = {}) {
  const { maxStreams = 20000, maxPerStream = 8 * 1024 * 1024, maxTotal = 64 * 1024 * 1024 } = limits;
  const limitFlags = new Set<string>();
  const candidates: Buffer[] = [];
  let structure = "";
  let total = 0, count = 0, pos = 0, last = 0;

  // Peels up to 4 filter layers (Flate / ASCII85 / ASCIIHex, in any order) and records each result.
  const decodeLayers = (buf: Buffer) => {
    let current = buf;
    for (let depth = 0; depth < 4; depth++) {
      const head = current.subarray(0, 256).toString("latin1");
      const tail = current.subarray(Math.max(0, current.length - 8)).toString("latin1").trim();
      let next: Buffer | null = null;
      try {
        if (current[0] === 0x78) next = inflateSync(current, { maxOutputLength: maxPerStream });
        else if (/^\s*<~/.test(head) || tail.endsWith("~>")) next = decodeAscii85(current, maxPerStream);
        else if (tail.endsWith(">") && /^[\s0-9a-fA-F]+$/.test(head.replace(/>\s*$/, ""))) next = decodeAsciiHex(current);
      } catch (err) {
        const e = err as Error & { code?: string };
        if (e && (e.code === "ERR_BUFFER_TOO_LARGE" || /larger than|too large/i.test(e.message || ""))) {
          limitFlags.add("pdf_stream_too_large_to_inspect");
        }
        return;
      }
      if (!next || !next.length) return;
      total += next.length;
      if (total > maxTotal) { limitFlags.add("pdf_decompression_limit_hit"); return; }
      candidates.push(next);
      current = next;
    }
  };

  while (true) {
    const s = latin1.indexOf("stream", pos);
    if (s === -1) break;
    pos = s + 6;
    if (latin1.startsWith("end", s - 3)) continue; // "endstream"
    if (!/>>\s*$/.test(latin1.slice(Math.max(0, s - 8), s))) continue; // must follow a dict

    let start = s + 6;
    if (latin1[start] === "\r") start++;
    if (latin1[start] === "\n") start++;
    const e = latin1.indexOf("endstream", start);
    if (e === -1) { limitFlags.add("pdf_unterminated_stream"); break; }

    if (++count > maxStreams) { limitFlags.add("pdf_stream_count_limit_hit"); break; }

    structure += latin1.slice(last, start);
    last = e;
    pos = e + 9;

    const body = Buffer.from(latin1.slice(start, e), "latin1");
    candidates.push(body);
    decodeLayers(body);
    if (limitFlags.has("pdf_decompression_limit_hit")) break;
  }
  structure += latin1.slice(last);
  return { structure, candidates: candidates.filter(looksTextual), limitFlags };
}

export function scanPdf(input: Buffer | Uint8Array | string, options: { maxBytes?: number } & Limits = {}): PdfScanResult {
  const maxBytes = options.maxBytes ?? 25 * 1024 * 1024;
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input as string);
  const findings: ScanFinding[] = [];
  const add = (id: string, severity: "block" | "review") => {
    if (!findings.some((f) => f.id === id)) findings.push({ id, severity });
  };

  if (!buf.length) add("pdf_empty", "block");
  else if (buf.length > maxBytes) add("pdf_too_large", "block");
  else if (!buf.subarray(0, 1024).toString("latin1").includes("%PDF-")) add("pdf_bad_magic", "block");
  else {
    const { structure, candidates, limitFlags } = splitStreams(buf.toString("latin1"), options);
    for (const flag of limitFlags) add(flag, "review"); // scan was incomplete -> never "allow" silently

    const sources = [structure, ...candidates.map((c) => c.toString("latin1"))];
    for (const source of sources) {
      // Undo #XX name obfuscation: /J#53 == /JS
      const text = source.replace(/#([0-9a-f]{2})/gi, (_m, h: string) => String.fromCharCode(parseInt(h, 16)));
      for (const rule of PDF_RULES) if (rule.re.test(text)) add(rule.id, rule.severity);
    }
  }

  const verdict = findings.some((f) => f.severity === "block") ? "block" : findings.length ? "review" : "allow";
  return { verdict, findings };
}
