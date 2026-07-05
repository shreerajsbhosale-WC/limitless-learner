import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Bell, Plus, Trash2, FileText, GraduationCap,
  Clock, ClipboardList, Flame, Trophy, Target, BookOpen, HelpCircle, Zap, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CardListSkeleton } from "@/components/Skeletons";
import { listStudyKits, deleteStudyKit } from "@/lib/library.functions";
import { useAuth } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Dashboard — Limitless" }] }),
  component: DashboardPage,
});

// Pastel palette for course cards (matches reference)
const coursePalettes = [
  { bg: "bg-[oklch(0.28_0.08_270)]", text: "text-white", emoji: "🪐" },
  { bg: "bg-[oklch(0.88_0.08_150)]", text: "text-[oklch(0.3_0.05_150)]", emoji: "🧬" },
  { bg: "bg-[oklch(0.92_0.09_90)]", text: "text-[oklch(0.35_0.05_80)]", emoji: "📐" },
  { bg: "bg-[oklch(0.9_0.05_60)]", text: "text-[oklch(0.32_0.05_60)]", emoji: "🏛️" },
  { bg: "bg-[oklch(0.87_0.07_200)]", text: "text-[oklch(0.3_0.05_220)]", emoji: "⚗️" },
  { bg: "bg-[oklch(0.9_0.08_350)]", text: "text-[oklch(0.32_0.05_350)]", emoji: "📚" },
];

function DashboardPage() {
  const { user } = useAuth();
  const { state, level } = useProgress();
  const xp = state.xp;
  const streak = state.streak;
  const list = useServerFn(listStudyKits);
  const del = useServerFn(deleteStudyKit);
  const qc = useQueryClient();

  const { data: kits, isLoading } = useQuery({
    queryKey: ["kits"],
    queryFn: () => list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kits"] });
      toast.success("Kit deleted");
    },
  });

  const firstName = user?.email?.split("@")[0]?.split(".")[0] ?? "there";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const kitsCount = kits?.length ?? 0;

  const stats = [
    { label: "Courses Enrolled", value: kitsCount, icon: BookOpen, tint: "bg-[oklch(0.92_0.08_280)] text-[oklch(0.45_0.2_285)]" },
    { label: "Hours Learned", value: "48.5", icon: Clock, tint: "bg-[oklch(0.9_0.08_220)] text-[oklch(0.45_0.18_230)]" },
    { label: "Quizzes Taken", value: 28, icon: HelpCircle, tint: "bg-[oklch(0.9_0.09_150)] text-[oklch(0.4_0.15_155)]" },
    { label: "Current Streak", value: `${streak || 7} Days`, icon: Flame, tint: "bg-[oklch(0.9_0.1_40)] text-[oklch(0.55_0.2_40)]" },
  ];

  // Weekly hours (visual only)
  const weekly = [3, 4.5, 2.5, 5, 3.5, 6, 4];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxHours = 6;

  const achievements = [
    { title: "Quiz Master", desc: "Score 90% in 5 quizzes", icon: Trophy, tint: "bg-[oklch(0.9_0.1_40)] text-[oklch(0.55_0.2_40)]" },
    { title: "Consistent Learner", desc: "Study 7 days in a row", icon: Flame, tint: "bg-[oklch(0.9_0.09_150)] text-[oklch(0.4_0.15_155)]" },
    { title: "Quick Learner", desc: "Finish a course in record time", icon: Zap, tint: "bg-[oklch(0.92_0.08_280)] text-[oklch(0.45_0.2_285)]" },
  ];

  const dailyGoals = [
    { label: "Complete 1 quiz", done: true },
    { label: "Study 30 mins", done: true },
    { label: "Read 1 chapter", done: false },
    { label: "Revise notes", done: false },
  ];
  const doneCount = dailyGoals.filter((g) => g.done).length;
  const goalPct = Math.round((doneCount / dailyGoals.length) * 100);

  return (
    <main className="flex-1">
      {/* Topbar */}
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 md:px-8 h-16">
          <div className="relative flex-1 max-w-xl ml-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search for courses, topics, quizzes…"
              className="pl-10 bg-secondary/60 border-transparent focus-visible:bg-card"
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-5" />
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l">
            <div className="size-9 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-sm">
              {displayName.charAt(0)}
            </div>
            <div className="hidden sm:block text-sm leading-tight">
              <div className="font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground">Learner</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-8 max-w-[1600px] mx-auto">
        {/* Welcome */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Welcome back, {displayName}! <span className="inline-block">👋</span>
            </h1>
            <p className="text-muted-foreground mt-1">You're doing amazing! Keep going.</p>
          </div>
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Link to="/study"><Plus className="size-4 mr-2" />New study kit</Link>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border p-5 hover-lift">
              <div className="flex items-center gap-4">
                <div className={`size-12 rounded-xl grid place-items-center ${s.tint}`}>
                  <s.icon className="size-6" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="font-display text-2xl font-bold">{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <section className="rounded-2xl bg-card border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold">Continue learning</h2>
                <Link to="/library" className="text-sm text-primary hover:underline">View all</Link>
              </div>
              {isLoading ? (
                <CardListSkeleton count={3} />
              ) : !kits?.length ? (
                <div className="rounded-xl border border-dashed p-10 text-center">
                  <FileText className="size-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No kits yet. Upload a PDF and let Limitless build your first study kit.
                  </p>
                  <Button asChild className="bg-gradient-primary text-primary-foreground">
                    <Link to="/study">Create your first kit</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {kits.slice(0, 4).map((k, i) => {
                    const pct = 25 + ((i * 17) % 70);
                    const p = coursePalettes[i % coursePalettes.length];
                    return (
                      <div key={k.id} className="group relative rounded-2xl border bg-card overflow-hidden hover-lift transition">
                        <Link to="/library/$kitId" params={{ kitId: k.id }} className="block">
                          <div className={`h-28 ${p.bg} ${p.text} grid place-items-center text-5xl`}>
                            <span>{p.emoji}</span>
                          </div>
                          <div className="p-4">
                            <h3 className="font-display font-semibold truncate">{k.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                              {k.source_type} · {new Date(k.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                            <div className="mt-3 space-y-1">
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-[11px] text-muted-foreground">{pct}% complete</div>
                            </div>
                          </div>
                        </Link>
                        <ConfirmDialog
                          trigger={
                            <button
                              aria-label={`Delete kit ${k.title}`}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition size-7 rounded-full bg-white/80 text-muted-foreground hover:text-destructive grid place-items-center"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          }
                          title="Delete this study kit?"
                          description="This permanently removes the kit and its notes, flashcards, and quiz."
                          confirmLabel="Delete"
                          destructive
                          onConfirm={() => remove.mutate(k.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Weekly activity + Upcoming */}
            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl bg-card border p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Weekly learning activity</h2>
                <WeeklyLineChart values={weekly} labels={days} max={maxHours} />
              </section>

              <section className="rounded-2xl bg-card border p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Upcoming</h2>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <ClipboardList className="size-4 text-primary" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">Practice quiz</div>
                      <div className="text-xs text-muted-foreground">Due in 2 days</div>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Clock className="size-4 text-accent" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">Focus session</div>
                      <div className="text-xs text-muted-foreground">Today · 25 min</div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/focus">Start</Link>
                    </Button>
                  </li>
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Target className="size-4 text-destructive" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">Review flashcards</div>
                      <div className="text-xs text-muted-foreground">Due today</div>
                    </div>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Daily goal ring */}
            <section className="rounded-2xl bg-card border p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Daily goal</h2>
              <div className="flex flex-col items-center">
                <ProgressRing pct={goalPct} />
                <p className="mt-4 text-sm text-center text-muted-foreground">
                  Great progress! <br />
                  <span className="text-foreground font-medium">
                    {dailyGoals.length - doneCount} tasks left for today
                  </span>
                </p>
              </div>
              <ul className="mt-5 space-y-2">
                {dailyGoals.map((g) => (
                  <li key={g.label} className="flex items-center gap-3 text-sm">
                    <span className={`size-5 rounded border grid place-items-center ${g.done ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                      {g.done && <span className="text-[10px]">✓</span>}
                    </span>
                    <span className={g.done ? "text-muted-foreground line-through" : ""}>{g.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Achievements */}
            <section className="rounded-2xl bg-card border p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Achievements</h2>
              <ul className="space-y-3">
                {achievements.map((a) => (
                  <li key={a.title} className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <a.icon className="size-4" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* AI Tutor */}
            <section className="rounded-2xl border p-6 bg-gradient-primary text-primary-foreground shadow-glow">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-90 mb-2">
                <Sparkles className="size-4" /> AI Tutor
              </div>
              <h3 className="font-display text-xl font-bold mb-2">
                Hi {displayName}! Need help?
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Ask anything about your notes and I'll break it down.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/assistant">
                  Open assistant <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative size-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} strokeWidth="10" className="stroke-muted" fill="none" />
        <circle
          cx="60" cy="60" r={r} strokeWidth="10" fill="none"
          strokeLinecap="round"
          stroke="url(#ring-grad)"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.18 255)" />
            <stop offset="100%" stopColor="oklch(0.78 0.13 175)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-2xl font-bold">{pct}%</div>
        </div>
      </div>
    </div>
  );
}
