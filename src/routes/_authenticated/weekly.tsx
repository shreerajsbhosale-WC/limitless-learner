import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Flame, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { weeklyReport } from "@/lib/focus.functions";

export const Route = createFileRoute("/_authenticated/weekly")({
  head: () => ({ meta: [{ title: "Weekly report — Limitless" }] }),
  component: WeeklyPage,
});

function WeeklyPage() {
  const fn = useServerFn(weeklyReport);
  const { data } = useQuery({ queryKey: ["weekly"], queryFn: () => fn() });
  const max = Math.max(1, ...(data?.days ?? []).map((d) => d.focus));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/"><ArrowLeft className="size-4 mr-2" />Home</Link>
        </Button>
        <h1 className="font-display text-4xl font-bold mb-8">This week</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Stat icon={<Clock className="size-5" />} value={`${data?.focusMinutes ?? 0}m`} label="Focused" />
          <Stat icon={<Flame className="size-5" />} value={`${data?.habitsDone ?? 0}`} label="Habits done" />
          <Stat icon={<BookOpen className="size-5" />} value={`${data?.kitsMade ?? 0}`} label="Kits made" />
        </div>

        <div className="rounded-2xl border border-border bg-gradient-card p-6">
          <p className="text-sm text-muted-foreground mb-4">Focus minutes per day</p>
          <div className="flex items-end justify-between gap-2 h-40">
            {(data?.days ?? []).map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-primary rounded-t-md" style={{ height: `${(d.focus / max) * 100}%`, minHeight: 4 }} />
                <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="text-primary mb-2">{icon}</div>
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
