import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { logFocusSession } from "@/lib/focus.functions";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus Timer — Limitless" }] }),
  component: FocusPage,
});

const MODES = {
  focus: { label: "Focus", mins: 25, color: "text-primary" },
  short: { label: "Short break", mins: 5, color: "text-accent" },
  long: { label: "Long break", mins: 15, color: "text-accent" },
};

function FocusPage() {
  const log = useServerFn(logFocusSession);
  const { award } = useProgress();
  const [mode, setMode] = useState<keyof typeof MODES>("focus");
  const [seconds, setSeconds] = useState(MODES.focus.mins * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => { setSeconds(MODES[mode].mins * 60); setRunning(false); }, [mode]);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(ref.current!);
          setRunning(false);
          if (mode === "focus") {
            log({ data: { minutes: MODES.focus.mins } }).catch(() => {});
            award(MODES.focus.mins * 10, `${MODES.focus.mins}m focus`);
            toast.success("🎯 Focus session complete!");
          } else {
            toast("Break over");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running, mode, log, award]);

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  const pct = 1 - seconds / (MODES[mode].mins * 60);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10 text-center">
        <Button asChild variant="ghost" size="sm" className="mb-6 self-start">
          <Link to="/"><ArrowLeft className="size-4 mr-2" />Home</Link>
        </Button>
        <h1 className="font-display text-4xl font-bold mb-2">Focus Timer</h1>
        <p className="text-muted-foreground mb-8">Pomodoro-style. +10 XP per minute focused.</p>

        <div className="flex justify-center gap-2 mb-8">
          {Object.entries(MODES).map(([k, v]) => (
            <Button key={k} variant={mode === k ? "default" : "outline"} onClick={() => setMode(k as keyof typeof MODES)}>
              {k !== "focus" && <Coffee className="size-4 mr-2" />}
              {v.label}
            </Button>
          ))}
        </div>

        <div className="relative mx-auto size-72 mb-8">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="hsl(var(--secondary))" strokeWidth="4" fill="none" />
            <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary))" strokeWidth="4" fill="none"
              strokeDasharray={`${pct * 283} 283`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div>
              <p className="font-display text-6xl font-bold tabular-nums">{m}:{s}</p>
              <p className={`text-sm mt-2 ${MODES[mode].color}`}>{MODES[mode].label}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          <Button size="lg" onClick={() => setRunning((r) => !r)} className="bg-gradient-primary text-primary-foreground shadow-glow">
            {running ? <><Pause className="size-5 mr-2" />Pause</> : <><Play className="size-5 mr-2" />Start</>}
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setRunning(false); setSeconds(MODES[mode].mins * 60); }}>
            <RotateCcw className="size-5 mr-2" />Reset
          </Button>
        </div>
      </main>
    </div>
  );
}
