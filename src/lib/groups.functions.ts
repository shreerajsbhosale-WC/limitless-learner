import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const listMyGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, xp_contributed, study_groups(id, name, join_code, owner_id)")
      .eq("user_id", userId);
    return { groups: memberships ?? [] };
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = makeCode();
    const { data: g, error } = await supabase
      .from("study_groups")
      .insert({ name: data.name, owner_id: userId, join_code: code })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("group_members").insert({ group_id: g.id, user_id: userId });
    return g;
  });

export const joinGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(4).max(12) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: g, error } = await supabase
      .from("study_groups")
      .select("id, name")
      .eq("join_code", data.code.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!g) throw new Error("Group not found");
    const { error: jerr } = await supabase
      .from("group_members")
      .insert({ group_id: g.id, user_id: userId });
    if (jerr && !jerr.message.includes("duplicate")) throw new Error(jerr.message);
    return g;
  });

export const leaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: members, error } = await supabase
      .from("group_members")
      .select("user_id, xp_contributed, profiles:user_id(display_name, email, avatar_url)")
      .eq("group_id", data.groupId)
      .order("xp_contributed", { ascending: false });
    if (error) throw new Error(error.message);
    return { members: members ?? [] };
  });

// Accepts a small XP delta and forwards it to a SECURITY DEFINER function.
// The DB function caps the delta per call (max 500) and RLS no longer permits
// clients to write xp_contributed directly, so users can no longer set an
// arbitrary absolute XP total on the leaderboard.
export const reportXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ delta: z.number().int().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("add_group_xp", { _delta: data.delta });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
