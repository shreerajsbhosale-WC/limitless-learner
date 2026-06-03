import { useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ACHIEVEMENTS, QUESTS } from "@/lib/gamification";
import { Button } from "@/components/ui/button";

export function XpHud() {
  const { level, title, xpIntoLevel, xpForLevel, state, claimQuest } = useProgress();
  const pct = Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100));
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1.5 hover:border-primary/60 transition"
          title="Your progress"
        >
          <span className="grid place-items-center size-7 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
            {level}
          </span>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</span>
            <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-foreground/80">
            <Flame className="size-3.5 text-orange-400" /> {state.streak}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card/95 backdrop-blur border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display text-lg">{title}</span>
            <span className="text-xs text-muted-foreground">Lv {level}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {xpIntoLevel} / {xpForLevel} XP
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="Streak" value={`${state.streak}d`} />
            <Stat label="Quizzes" value={state.totals.quizzesCompleted} />
            <Stat label="Bosses" value={state.totals.bossesDefeated} />
          </div>
        </div>

        <div className="p-4 border-b border-border">
          <p className="text-xs uppercase tracking-widest text-primary mb-2">Daily quests</p>
          <ul className="space-y-2">
            {QUESTS.map((q) => {
              const progress = state.daily[q.metric];
              const done = progress >= q.goal;
              const claimed = state.daily.claimedQuests.includes(q.id);
              return (
                <li key={q.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{q.name}</p>
                    <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, (progress / q.goal) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {Math.min(progress, q.goal)} / {q.goal} · +{q.xp} XP
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={claimed ? "secondary" : done ? "default" : "outline"}
                    disabled={!done || claimed}
                    onClick={() => claimQuest(q.id)}
                    className={done && !claimed ? "bg-gradient-primary text-primary-foreground" : ""}
                  >
                    {claimed ? "Claimed" : done ? "Claim" : "Locked"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4">
          <p className="text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
            <Trophy className="size-3.5" /> Achievements ({state.achievements.length}/{ACHIEVEMENTS.length})
          </p>
          <div className="grid grid-cols-5 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = state.achievements.includes(a.id);
              return (
                <div
                  key={a.id}
                  title={`${a.name} — ${a.desc}`}
                  className={`aspect-square grid place-items-center rounded-lg text-lg border ${
                    got
                      ? "border-primary/60 bg-primary/10 shadow-glow"
                      : "border-border bg-secondary/40 opacity-40 grayscale"
                  }`}
                >
                  {a.icon}
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-secondary/40 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-sm tabular-nums">{value}</p>
    </div>
  );
}
