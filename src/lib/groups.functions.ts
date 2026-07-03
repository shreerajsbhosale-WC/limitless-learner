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
      .select("user_id, xp_contributed")
      .eq("group_id", data.groupId)
      .order("xp_contributed", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (members ?? []).map((m) => m.user_id);
    let profilesById: Record<string, { display_name: string | null; email: string | null; avatar_url: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url")
        .in("id", ids);
      profilesById = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
    }
    return {
      members: (members ?? []).map((m) => ({ ...m, profiles: profilesById[m.user_id] ?? null })),
    };
  });

// Server-verified XP sync for a specific group.
// Ignores any client-supplied delta — the DB function derives earned XP
// from the caller's real focus sessions + habit logs since their last sync
// for that group, caps the result per call, and advances the sync timestamp
// atomically. The RPC is service-role only, so authenticated users cannot
// invoke it directly through PostgREST.
export const reportXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    // Verify caller is actually a member of this group under RLS before
    // running the privileged sync.
    const { data: membership, error: mErr } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", data.groupId)
      .eq("user_id", userId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!membership) throw new Error("Not a member of this group");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: awarded, error } = await supabaseAdmin.rpc("sync_group_xp", {
      _user_id: userId,
      _group_id: data.groupId,
    });
    if (error) throw new Error(error.message);
    return { awarded: awarded ?? 0 };
  });
