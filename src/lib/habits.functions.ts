import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PRESET_HABITS = [
  { name: "Study 1 hour", emoji: "📚" },
  { name: "Sleep by 10pm", emoji: "😴" },
  { name: "No phone after 9pm", emoji: "📵" },
  { name: "Homework done", emoji: "✍️" },
  { name: "Exercise 20 min", emoji: "🏃" },
  { name: "Read 15 min", emoji: "📖" },
];

export const listHabits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: habits, error } = await supabase
      .from("habits")
      .select("*")
      .eq("active", true)
      .order("created_at");
    if (error) throw new Error(error.message);

    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, log_date")
      .eq("user_id", userId)
      .gte("log_date", since);

    return { habits: habits ?? [], logs: logs ?? [], today };
  });

export const seedPresets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("habits").select("id").eq("is_preset", true);
    if (existing && existing.length > 0) return { ok: true, skipped: true };
    const rows = PRESET_HABITS.map((p) => ({ ...p, is_preset: true, user_id: userId }));
    const { error } = await supabase.from("habits").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ name: z.string().min(1).max(80), emoji: z.string().max(8).default("✨") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("habits")
      .insert({ name: data.name, emoji: data.emoji, user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("habits").update({ active: false }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ habitId: z.string().uuid(), date: z.string(), done: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.done) {
      const { error } = await supabase
        .from("habit_logs")
        .insert({ habit_id: data.habitId, log_date: data.date, user_id: userId });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      await supabase.from("habit_logs").delete().eq("habit_id", data.habitId).eq("log_date", data.date);
    }
    return { ok: true };
  });
