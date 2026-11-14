import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ProfileName } from "@/lib/screening";

const appealSchema = z.object({ caseId: z.string().uuid(), justification: z.string().min(1).max(1000) });
const decisionSchema = z.object({ caseId: z.string().uuid(), decision: z.enum(["approve", "deny"]), note: z.string().max(500).default("") });

async function ensureReviewer(supabase: { from: (table: "user_roles") => any }, userId: string): Promise<void> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "reviewer").maybeSingle();
  if (error || !data) throw new Error("Reviewer access required.");
}

export const screenStudyText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ text: z.string().min(1).max(120_000), mode: z.enum(["input", "document"]).default("document") }).parse(data))
  .handler(async ({ data }) => {
    const secret = process.env["OVERRIDE_SECRET"];
    if (!secret || secret.length < 32) throw new Error("Screening service is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveActorId, screenTextContent } = await import("@/lib/screening.server");
    const actorId = await resolveActorId(supabaseAdmin, getRequestHeader("authorization"), getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "", secret);
    return screenTextContent(supabaseAdmin, actorId, data.text, data.mode, secret);
  });

export const fileScreeningAppeal = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => appealSchema.parse(data))
  .handler(async ({ data }) => {
    const secret = process.env["OVERRIDE_SECRET"];
    if (!secret || secret.length < 32) throw new Error("Screening service is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { evaluateText, PROFILES } = await import("@/lib/screening");
    const { resolveActorId, createApproval } = await import("@/lib/screening.server");
    const actorId = await resolveActorId(supabaseAdmin, getRequestHeader("authorization"), getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "", secret);
    const { data: row, error } = await supabaseAdmin.from("screening_cases").select("id, user_id, status, profile, manual_review").eq("id", data.caseId).eq("user_id", actorId).maybeSingle();
    if (error || !row) return { status: "not_found" as const };
    const justification = data.justification.trim();
    if (justification.length < 15) return { status: "justification_too_short" as const, min: 15 };
    if (evaluateText(justification, "input").verdict === "block") return { status: "rejected" as const, reason: "Please revise the appeal note and try again." };
    const profile = row.profile as ProfileName;
    const approval = !row.manual_review
      ? await createApproval(secret, profile, "auto", "auto-approved: low-risk signals only")
      : null;
    const { data: result, error: appealError } = await supabaseAdmin.rpc("file_screening_appeal", {
      p_case_id: data.caseId,
      p_user_id: actorId,
      p_justification: justification,
      p_auto_approval: approval,
    });
    if (appealError) throw new Error("Your appeal could not be submitted.");
    const status = (result as { status?: string })?.status ?? "pending_review";
    if (status === "approved") {
      const { data: approved, error: approvedError } = await supabaseAdmin.from("screening_cases").select("*").eq("id", data.caseId).single();
      if (approvedError || !approved) throw new Error("Your appeal was approved but could not be resumed.");
      const { mintScreeningOverride } = await import("@/lib/screening.server");
      return { status, token: await mintScreeningOverride(approved, secret), profile };
    }
    return { status };
  });

export const getScreeningAppealStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ caseId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const secret = process.env["OVERRIDE_SECRET"];
    if (!secret || secret.length < 32) throw new Error("Screening service is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveActorId, mintScreeningOverride } = await import("@/lib/screening.server");
    const actorId = await resolveActorId(supabaseAdmin, getRequestHeader("authorization"), getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "", secret);
    const { data: row, error } = await supabaseAdmin.from("screening_cases").select("*").eq("id", data.caseId).eq("user_id", actorId).maybeSingle();
    if (error || !row) return { status: "not_found" as const };
    if (row.status === "approved") return { status: "approved" as const, token: await mintScreeningOverride(row, secret), profile: row.profile as ProfileName };
    return { status: row.status as string };
  });

export const getReviewerAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "reviewer").maybeSingle();
    return { allowed: Boolean(data) };
  });

export const listReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureReviewer(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("screening_cases")
      .select("id, user_id, kind, mode, excerpt, categories, internal_reasons, justification, profile, appealed_at, created_at")
      .eq("status", "pending_review").order("appealed_at", { ascending: true });
    if (error) throw new Error("The review queue could not be loaded.");
    return data ?? [];
  });

export const decideScreeningAppeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => decisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureReviewer(context.supabase, context.userId);
    const secret = process.env["OVERRIDE_SECRET"];
    if (!secret || secret.length < 32) throw new Error("Screening service is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("screening_cases").select("user_id, profile").eq("id", data.caseId).maybeSingle();
    if (error || !row) return { status: "invalid_state" as const };
    const profile = row.profile as ProfileName;
    const approval = data.decision === "approve" ? await (await import("@/lib/screening.server")).createApproval(secret, profile, context.userId, data.note) : null;
    const { data: result, error: decideError } = await supabaseAdmin.rpc("decide_screening_case", {
      p_case_id: data.caseId,
      p_reviewer_id: context.userId,
      p_decision: data.decision,
      p_note: data.note,
      p_approval: approval,
    });
    if (decideError) throw new Error("The decision could not be saved.");
    return result as { status: string };
  });

export const listOverrideAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureReviewer(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data, error }, { data: integrity, error: integrityError }] = await Promise.all([
      supabaseAdmin.from("override_audit").select("seq, ts, type, user_id, case_id, data, hash, prev_hash").order("seq", { ascending: false }).limit(200),
      supabaseAdmin.rpc("verify_override_audit"),
    ]);
    if (error || integrityError) throw new Error("The audit log could not be loaded.");
    return { entries: data ?? [], integrity: integrity as { ok: boolean; brokenAt?: number; entries?: number } };
  });
