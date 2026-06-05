import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Check, Trash2, Flame } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listHabits, seedPresets, addHabit, removeHabit, toggleHabit } from "@/lib/habits.functions";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({ meta: [{ title: "Habits — Limitless" }] }),
  component: HabitsPage,
});

function HabitsPage() {
  const list = useServerFn(listHabits);
  const seed = useServerFn(seedPresets);
  const add = useServerFn(addHabit);
  const remove = useServerFn(removeHabit);
  const toggle = useServerFn(toggleHabit);
  const { award } = useProgress();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");

  const q = useQuery({ queryKey: ["habits"], queryFn: () => list() });

  useEffect(() => {
    if (q.data && q.data.habits.length === 0) {
      seed().then(() => q.refetch());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.habits.length]);

  const today = q.data?.today ?? new Date().toISOString().slice(0, 10);
  const doneToday = new Set((q.data?.logs ?? []).filter((l) => l.log_date === today).map((l) => l.habit_id));
  const last7 = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10));

  const handleToggle = async (id: string) => {
    const done = !doneToday.has(id);
    await toggle({ data: { habitId: id, date: today, done } });
    if (done) award(50, "Habit complete");
    q.refetch();
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    await add({ data: { name: name.trim(), emoji } });
    setName(""); setEmoji("✨");
    q.refetch();
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/"><ArrowLeft className="size-4 mr-2" />Home</Link>
        </Button>
        <h1 className="font-display text-4xl font-bold mb-2">Habits</h1>
        <p className="text-muted-foreground mb-8">Daily check-ins. Each one is +50 XP. Build streaks.</p>

        <div className="rounded-2xl border border-border bg-gradient-card p-4 mb-6 flex gap-2">
          <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-16 text-center" maxLength={2} />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New habit (e.g. Meditate 10 min)" />
          <Button onClick={handleAdd}><Plus className="size-4 mr-2" />Add</Button>
        </div>

        <div className="space-y-2">
          {(q.data?.habits ?? []).map((h) => {
            const checked = doneToday.has(h.id);
            const streak = last7.reduce((s, d) => {
              const has = (q.data?.logs ?? []).some((l) => l.habit_id === h.id && l.log_date === d);
              return has ? s + 1 : s;
            }, 0);
            return (
              <div key={h.id} className="rounded-xl border border-border bg-gradient-card p-4 flex items-center gap-3">
                <button
                  onClick={() => handleToggle(h.id)}
                  className={`size-10 rounded-lg border grid place-items-center transition-all
                    ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                >
                  {checked ? <Check className="size-5" /> : <span className="text-lg">{h.emoji}</span>}
                </button>
                <div className="flex-1">
                  <p className="font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame className="size-3" /> {streak}/7 days this week
                  </p>
                </div>
                <div className="flex gap-1">
                  {last7.map((d) => {
                    const has = (q.data?.logs ?? []).some((l) => l.habit_id === h.id && l.log_date === d);
                    return <div key={d} className={`size-3 rounded-sm ${has ? "bg-primary" : "bg-secondary"}`} />;
                  })}
                </div>
                <Button variant="ghost" size="icon" onClick={async () => { await remove({ data: { id: h.id } }); q.refetch(); toast("Habit removed"); }}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
