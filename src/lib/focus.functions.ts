import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const logFocusSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ minutes: z.number().min(1).max(240) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("focus_sessions")
      .insert({ minutes: data.minutes, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const weeklyReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const sinceIso = new Date(Date.now() - 7 * 86400000).toISOString();
    const sinceDate = sinceIso.slice(0, 10);

    const [focusRes, habitsRes, kitsRes] = await Promise.all([
      supabase.from("focus_sessions").select("minutes, created_at").gte("created_at", sinceIso),
      supabase.from("habit_logs").select("log_date").eq("user_id", userId).gte("log_date", sinceDate),
      supabase.from("study_kits").select("id, created_at").gte("created_at", sinceIso),
    ]);

    const focusMinutes = (focusRes.data ?? []).reduce((s, r) => s + (r.minutes ?? 0), 0);
    const habitsDone = (habitsRes.data ?? []).length;
    const kitsMade = (kitsRes.data ?? []).length;

    // Per-day breakdown
    const days: Record<string, { focus: number; habits: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days[d] = { focus: 0, habits: 0 };
    }
    for (const f of focusRes.data ?? []) {
      const d = (f.created_at ?? "").slice(0, 10);
      if (days[d]) days[d].focus += f.minutes ?? 0;
    }
    for (const h of habitsRes.data ?? []) {
      const d = h.log_date as string;
      if (days[d]) days[d].habits += 1;
    }

    return {
      focusMinutes,
      habitsDone,
      kitsMade,
      days: Object.entries(days).map(([date, v]) => ({ date, ...v })),
    };
  });
