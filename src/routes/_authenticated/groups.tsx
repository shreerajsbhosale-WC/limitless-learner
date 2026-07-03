import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Users, Copy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listMyGroups, createGroup, joinGroup, leaderboard, reportXp } from "@/lib/groups.functions";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({ meta: [{ title: "Study groups — Limitless" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const list = useServerFn(listMyGroups);
  const create = useServerFn(createGroup);
  const join = useServerFn(joinGroup);
  const lb = useServerFn(leaderboard);
  const sync = useServerFn(reportXp);
  const { state } = useProgress();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["my-groups"], queryFn: () => list() });
  const lbQ = useQuery({
    queryKey: ["lb", activeId],
    queryFn: () => lb({ data: { groupId: activeId! } }),
    enabled: !!activeId,
  });

  // Ask the server to sync XP for each group the user belongs to.
  // The server derives XP from real activity (focus + habits) since the last
  // sync per group and caps the award — clients no longer supply a delta.
  useEffect(() => {
    const groups = q.data?.groups ?? [];
    if (!groups.length) return;
    (async () => {
      for (const m of groups as Array<{ group_id: string }>) {
        try { await sync({ data: { groupId: m.group_id } }); } catch {}
      }
      if (activeId) lbQ.refetch();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.groups, state.xp]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/"><ArrowLeft className="size-4 mr-2" />Home</Link>
        </Button>
        <h1 className="font-display text-4xl font-bold mb-2">Study groups</h1>
        <p className="text-muted-foreground mb-8">Compete with friends on XP. Friendly only.</p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-gradient-card p-4 space-y-2">
            <p className="font-medium">Create a group</p>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
              <Button onClick={async () => {
                if (!name.trim()) return;
                const g = await create({ data: { name: name.trim() } });
                toast.success(`Created ${g.name} (code ${g.join_code})`);
                setName(""); q.refetch();
              }}><Plus className="size-4 mr-2" />Create</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-card p-4 space-y-2">
            <p className="font-medium">Join with code</p>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCD12" />
              <Button onClick={async () => {
                try { const g = await join({ data: { code } }); toast.success(`Joined ${g.name}`); setCode(""); q.refetch(); }
                catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
              }}><Users className="size-4 mr-2" />Join</Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">My groups</p>
            {(q.data?.groups ?? []).map((m: any) => (
              <button key={m.group_id} onClick={() => setActiveId(m.group_id)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${activeId === m.group_id ? "border-primary bg-primary/5" : "border-border bg-gradient-card hover:border-primary/50"}`}>
                <p className="font-medium">{m.study_groups?.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Code: <span className="font-mono">{m.study_groups?.join_code}</span>
                  <Copy className="size-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(m.study_groups?.join_code); toast("Copied"); }} />
                </p>
              </button>
            ))}
            {q.data?.groups.length === 0 && <p className="text-sm text-muted-foreground">No groups yet.</p>}
          </div>

          <div className="md:col-span-2">
            {activeId ? (
              <div className="rounded-2xl border border-border bg-gradient-card p-6">
                <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Leaderboard</p>
                <div className="space-y-2">
                  {(lbQ.data?.members ?? []).map((m: any, i: number) => (
                    <div key={m.user_id} className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                      <span className="size-8 grid place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold text-sm">{i + 1}</span>
                      <span className="flex-1 truncate">{m.profiles?.display_name || m.profiles?.email || "Anon"}</span>
                      <span className="font-mono text-sm">{m.xp_contributed} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a group to see its leaderboard.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
