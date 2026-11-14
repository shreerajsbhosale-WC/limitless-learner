import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { classifyPdf, classifyText, evaluateIdentifier, evaluateText, publicReasons, type Classification, type EvaluationResult, type ProfileName } from "@/lib/screening";
import { scanPdf } from "@/lib/pdf-guard.server";

type AdminClient = SupabaseClient<Database>;
type CaseRow = Database["public"]["Tables"]["screening_cases"]["Row"];
type TokenPayload = { purpose: "override" | "pdf_receipt"; uid: string; hash: string; kind: "text" | "pdf"; profile: ProfileName; exp: number; cid?: string; nonce?: string };

const ENCODER = new TextEncoder();
const PROFILE_DEFAULTS: Record<ProfileName, { expires: number }> = {
  quote_only: { expires: 24 * 60 * 60 * 1000 },
  document_sandbox: { expires: 24 * 60 * 60 * 1000 },
};

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function digestHex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signPayload(payload: TokenPayload, secret: string): Promise<string> {
  const encoded = base64url(ENCODER.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey("raw", ENCODER.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, ENCODER.encode(encoded)));
  return `${encoded}.${base64url(signature)}`;
}

async function verifyPayload(token: string, secret: string): Promise<TokenPayload | null> {
  const [encoded, signature, ...rest] = token.split(".");
  if (!encoded || !signature || rest.length) return null;
  try {
    const key = await crypto.subtle.importKey("raw", ENCODER.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, fromBase64url(signature), ENCODER.encode(encoded))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64url(encoded))) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function resolveActorId(admin: AdminClient, authorization: string | null, ip: string, secret: string): Promise<string> {
  if (authorization) {
    if (!authorization.startsWith("Bearer ")) throw new Error("Unauthorized");
    const token = authorization.slice(7);
    if (!token) throw new Error("Unauthorized");
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) throw new Error("Unauthorized");
    return data.user.id;
  }
  const hash = await digestHex(ENCODER.encode(`${secret}:${ip || "unknown"}`));
  const hex = `${hash.slice(0, 12)}4${hash.slice(13, 16)}a${hash.slice(17, 20)}${hash.slice(20, 32)}`;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function appendAudit(admin: AdminClient, type: string, userId: string, caseId = "", data: Record<string, unknown> = {}): Promise<void> {
  const { error } = await admin.rpc("append_override_audit", {
    p_type: type,
    p_user_id: userId,
    p_case_id: caseId,
    p_data: data,
  });
  if (error) throw new Error("Screening audit could not be recorded.");
}

function profileFor(mode: "input" | "document"): ProfileName {
  return mode === "document" ? "document_sandbox" : "quote_only";
}

async function createOrFindCase(admin: AdminClient, userId: string, kind: "text" | "pdf", mode: "input" | "document", hash: string, excerpt: string, categories: string[], reasons: string[], verdict: "review" | "block", classification: Classification): Promise<CaseRow> {
  const { data: prior, error: priorError } = await admin.from("screening_cases")
    .select("*").eq("user_id", userId).eq("content_hash", hash)
    .in("status", ["open", "pending_review", "approved", "denied"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (priorError) throw new Error("Screening could not be completed.");
  if (prior) return prior;

  const isHard = classification.kind === "hard";
  const profile = isHard ? profileFor(mode) : classification.profile;
  const { data, error } = await admin.from("screening_cases").insert({
    user_id: userId,
    kind,
    mode,
    content_hash: hash,
    excerpt: kind === "pdf" ? excerpt.slice(0, 400) : excerpt.slice(0, 400),
    categories,
    internal_reasons: reasons,
    verdict,
    profile,
    manual_review: isHard ? true : classification.manual,
    status: isHard ? "blocked" : "open",
  }).select("*").single();
  if (error) {
    if (error.code === "23505") {
      const { data: raced } = await admin.from("screening_cases").select("*").eq("user_id", userId).eq("content_hash", hash)
        .in("status", ["open", "pending_review", "approved", "denied"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (raced) return raced;
    }
    throw new Error("Screening could not be recorded.");
  }
  if (isHard) {
    await appendAudit(admin, "hard_block", userId, data.id, { categories, hash });
    if (classification.kind === "hard" && classification.strike) {
      await appendAudit(admin, "strike", userId, data.id, { reason: `hard_block:${categories.join(",")}` });
    }
  } else {
    await appendAudit(admin, "case_opened", userId, data.id, { manual: classification.manual, profile });
  }
  return data;
}

async function mintOverrideToken(row: CaseRow, secret: string): Promise<string> {
  const approval = row.approval as { expiresAt?: number; nonce?: string } | null;
  if (!approval?.expiresAt || !approval.nonce) throw new Error("Approval is not ready yet.");
  return signPayload({
    purpose: "override", uid: row.user_id, hash: row.content_hash, kind: row.kind as "text" | "pdf",
    profile: row.profile as ProfileName, exp: approval.expiresAt, cid: row.id, nonce: approval.nonce,
  }, secret);
}

export type ScreenResult =
  | { status: "allowed"; receipt?: string }
  | { status: "needs_appeal" | "pending_review" | "blocked" | "denied"; caseId?: string; appealable: boolean; reasons: string[] }
  | { status: "approved"; caseId: string; token: string; profile: ProfileName; receipt?: string };

function existingResult(row: CaseRow, reasons: string[]): ScreenResult {
  if (row.status === "blocked") return { status: "blocked", appealable: false, reasons };
  if (row.status === "denied") return { status: "denied", appealable: false, reasons: ["A reviewer already declined this content."] };
  if (row.status === "pending_review") return { status: "pending_review", caseId: row.id, appealable: false, reasons };
  if (row.status === "open") return { status: "needs_appeal", caseId: row.id, appealable: true, reasons };
  return { status: "allowed", reasons } as ScreenResult;
}

export async function screenTextContent(admin: AdminClient, userId: string, text: string, mode: "input" | "document", secret: string): Promise<ScreenResult> {
  const result = evaluateText(text, mode);
  if (result.verdict === "allow") return { status: "allowed" };
  const classification = classifyText(result, mode);
  const hash = await digestHex(ENCODER.encode(text));
  const row = await createOrFindCase(admin, userId, "text", mode, hash, text, classification.categories, result.reasons, result.verdict, classification);
  if (row.status === "approved") return { status: "approved", caseId: row.id, token: await mintOverrideToken(row, secret), profile: row.profile as ProfileName };
  return existingResult(row, publicReasons(classification.categories));
}

export async function screenPdfContent(admin: AdminClient, userId: string, bytes: Uint8Array, filename: string, secret: string, token?: string): Promise<ScreenResult> {
  const identifier = evaluateIdentifier(filename);
  if (identifier.verdict !== "allow") {
    const hash = await digestHex(bytes);
    const row = await createOrFindCase(admin, userId, "pdf", "document", hash, `PDF filename rejected: ${filename.slice(0, 100)}`,
      ["filename"], identifier.reasons, "block", { kind: "hard", strike: false, categories: ["filename"] });
    return existingResult(row, publicReasons(["filename"]));
  }
  const scan = scanPdf(bytes);
  const hash = await digestHex(bytes);
  if (scan.verdict === "allow") {
    return { status: "allowed", receipt: await signPayload({ purpose: "pdf_receipt", uid: userId, hash, kind: "pdf", profile: "document_sandbox", exp: Date.now() + 10 * 60 * 1000 }, secret) };
  }
  const classification = classifyPdf(scan);
  const row = await createOrFindCase(admin, userId, "pdf", "document", hash, `PDF upload, ${bytes.byteLength} bytes`, classification.categories,
    scan.findings.map((finding) => finding.id), scan.verdict, classification);
  if (row.status === "approved") {
    const overrideToken = token ?? await mintOverrideToken(row, secret);
    const redeemed = await redeemOverride(admin, userId, overrideToken, hash, "pdf", secret);
    if (!redeemed.ok) return { status: "blocked", appealable: false, reasons: ["This approval has expired or was already used."] };
    const receipt = await signPayload({ purpose: "pdf_receipt", uid: userId, hash, kind: "pdf", profile: redeemed.profile, exp: Date.now() + 10 * 60 * 1000 }, secret);
    return { status: "approved", caseId: row.id, token: overrideToken, profile: redeemed.profile, receipt };
  }
  return existingResult(row, publicReasons(classification.categories));
}

export async function redeemOverride(admin: AdminClient, userId: string, token: string, hash: string, kind: "text" | "pdf", secret: string): Promise<{ ok: true; profile: ProfileName } | { ok: false }> {
  const payload = await verifyPayload(token, secret);
  if (!payload || payload.purpose !== "override" || payload.uid !== userId || payload.hash !== hash || payload.kind !== kind || !payload.cid || !payload.nonce) return { ok: false };
  const { data: row, error } = await admin.from("screening_cases").select("id, user_id, status, approval")
    .eq("id", payload.cid).eq("user_id", userId).maybeSingle();
  if (error || !row || row.status !== "approved") return { ok: false };
  const approval = row.approval as { nonce?: string; expiresAt?: number } | null;
  if (approval?.nonce !== payload.nonce || approval.expiresAt !== payload.exp) return { ok: false };
  const { data: redeemed, error: redeemError } = await admin.rpc("redeem_screening_case", { p_case_id: payload.cid, p_user_id: userId });
  if (redeemError || !redeemed) return { ok: false };
  return { ok: true, profile: payload.profile };
}

export async function verifyPdfReceipt(receipt: string, userId: string, secret: string): Promise<boolean> {
  const payload = await verifyPayload(receipt, secret);
  return Boolean(payload && payload.purpose === "pdf_receipt" && payload.kind === "pdf" && payload.uid === userId);
}

export async function recordGeneratedBlock(admin: AdminClient, userId: string, content: string, result: EvaluationResult): Promise<void> {
  const hash = await digestHex(ENCODER.encode(content));
  const { data: row, error } = await admin.from("screening_cases").insert({
    user_id: userId, kind: "text", mode: "document", content_hash: hash,
    excerpt: content.slice(0, 400), categories: [...new Set(result.hits.map((hit) => hit.category))],
    internal_reasons: result.reasons, verdict: "block", profile: "document_sandbox", manual_review: true, status: "blocked",
  }).select("id").single();
  if (error) throw new Error("Generated material could not be screened safely.");
  await appendAudit(admin, "generated_content_blocked", userId, row.id, { categories: [...new Set(result.hits.map((hit) => hit.category))], hash });
}

export async function recordSaveBlock(admin: AdminClient, userId: string, content: string, result: EvaluationResult): Promise<void> {
  await recordGeneratedBlock(admin, userId, content, result);
}

export async function createApproval(secret: string, profile: ProfileName, by: string, note: string): Promise<Record<string, unknown>> {
  if (secret.length < 32) throw new Error("Screening service is not configured.");
  return { by, note: note.slice(0, 500), at: Date.now(), expiresAt: Date.now() + PROFILE_DEFAULTS[profile].expires, nonce: base64url(crypto.getRandomValues(new Uint8Array(16))) };
}

export async function createPdfBytes(base64: string): Promise<Uint8Array> {
  try {
    return fromBase64url(base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""));
  } catch {
    try { return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)); }
    catch { throw new Error("The uploaded PDF could not be read."); }
  }
}
