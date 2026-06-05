import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer, RotateCcw } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";

type Card = { id: string; pairId: string; text: string; kind: "front" | "back" };

export function MatchGame({ cards }: { cards: { front: string; back: string }[] }) {
  const subset = useMemo(() => cards.slice(0, 8), [cards]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [start, setStart] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const { award } = useProgress();

  const init = () => {
    const built: Card[] = subset.flatMap((c, i) => [
      { id: `f${i}`, pairId: `${i}`, text: c.front, kind: "front" },
      { id: `b${i}`, pairId: `${i}`, text: c.back, kind: "back" },
    ]);
    setDeck(built.sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setWrong(new Set());
    setPicked(null);
    setStart(Date.now());
    setElapsed(0);
  };

  useEffect(() => { init(); /* eslint-disable-next-line */ }, [subset]);

  useEffect(() => {
    if (matched.size === subset.length * 2) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(t);
  }, [start, matched.size, subset.length]);

  const done = matched.size === subset.length * 2 && subset.length > 0;
  useEffect(() => {
    if (done) {
      const bonus = Math.max(50, 300 - elapsed * 2);
      award(bonus, `Match: ${elapsed}s`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const handle = (c: Card) => {
    if (matched.has(c.id)) return;
    if (!picked) { setPicked(c.id); return; }
    if (picked === c.id) return;
    const a = deck.find((x) => x.id === picked)!;
    if (a.pairId === c.pairId) {
      setMatched((m) => new Set([...m, a.id, c.id]));
      setPicked(null);
    } else {
      setWrong(new Set([a.id, c.id]));
      setTimeout(() => { setWrong(new Set()); setPicked(null); }, 600);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Timer className="size-4" /> {elapsed}s · {matched.size / 2}/{subset.length} pairs
        </p>
        <Button variant="outline" size="sm" onClick={init}><RotateCcw className="size-4 mr-2" />Restart</Button>
      </div>
      {done && (
        <div className="rounded-xl bg-gradient-primary text-primary-foreground p-4 text-center shadow-glow">
          <p className="font-display text-xl">Cleared in {elapsed}s</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {deck.map((c) => {
          const isMatched = matched.has(c.id);
          const isWrong = wrong.has(c.id);
          const isPicked = picked === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handle(c)}
              disabled={isMatched}
              className={`min-h-[110px] rounded-xl border p-3 text-left text-sm transition-all
                ${isMatched ? "border-primary/30 bg-primary/5 opacity-40" :
                  isWrong ? "border-destructive bg-destructive/10" :
                  isPicked ? "border-primary bg-primary/10" :
                  "border-border bg-gradient-card hover:border-primary/50"}`}
            >
              {c.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
