import { useEffect, useState } from "react";
import { Swords, Skull, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bossHpFor } from "@/lib/gamification";

export interface BossResult {
  victory: boolean;
  damage: number;
  xp: number;
}

export function BossBattle({
  topic,
  correct,
  total,
  xpAwarded,
  onClose,
}: {
  topic: string;
  correct: number;
  total: number;
  xpAwarded: number;
  onClose: () => void;
}) {
  const maxHp = bossHpFor(total);
  const damage = Math.round((correct / Math.max(1, total)) * maxHp);
  const remaining = Math.max(0, maxHp - damage);
  const victory = correct / Math.max(1, total) >= 0.7;
  const perfect = correct === total;

  const [animHp, setAnimHp] = useState(maxHp);
  useEffect(() => {
    const t = setTimeout(() => setAnimHp(remaining), 200);
    return () => clearTimeout(t);
  }, [remaining]);

  const hpPct = (animHp / maxHp) * 100;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-primary/40 bg-gradient-card p-8 shadow-glow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Boss Battle</p>
            <h2 className="font-display text-2xl font-bold">{topic}</h2>
          </div>
          <div className="size-16 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
            {victory ? (
              <Trophy className="size-8 text-primary-foreground" />
            ) : (
              <Skull className="size-8 text-primary-foreground" />
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1 tabular-nums">
            <span className="flex items-center gap-1"><Swords className="size-3" /> Boss HP</span>
            <span>{animHp} / {maxHp}</span>
          </div>
          <div className="w-full h-4 rounded-full bg-secondary overflow-hidden border border-border">
            <div
              className={`h-full transition-all duration-1000 ease-out ${
                victory ? "bg-gradient-to-r from-primary to-accent" : "bg-destructive/70"
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-foreground/80">
            You dealt <span className="text-primary font-semibold">{damage}</span> damage
            ({correct} / {total} correct)
          </p>
        </div>

        <div className="rounded-2xl bg-secondary/40 border border-border p-4 mb-6">
          <p className="font-display text-lg mb-1">
            {perfect ? "🌟 Flawless Victory!" : victory ? "⚔️ Victory!" : "💀 Boss survived…"}
          </p>
          <p className="text-sm text-muted-foreground">
            {perfect
              ? "You annihilated the boss without a scratch. Legendary."
              : victory
                ? "The boss falls. Loot acquired, XP gained."
                : "The boss still stands. Review your notes and try again — you've got this."}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-primary font-semibold">+{xpAwarded} XP</span> earned
          </p>
        </div>

        <Button
          size="lg"
          onClick={onClose}
          className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
        >
          {victory ? "Claim victory" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
