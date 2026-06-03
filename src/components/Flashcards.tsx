import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudyMaterials } from "@/lib/study.functions";
import { useProgress } from "@/hooks/use-progress";

export function Flashcards({ cards }: { cards: StudyMaterials["flashcards"] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());
  const { recordFlashReview } = useProgress();
  if (!cards.length) return null;
  const card = cards[i];

  const go = (delta: number) => {
    setFlipped(false);
    setI((p) => (p + delta + cards.length) % cards.length);
  };

  const grade = (correct: boolean) => {
    if (!reviewed.has(i)) {
      recordFlashReview(correct);
      setReviewed((s) => new Set(s).add(i));
    }
    setTimeout(() => go(1), 250);
  };

  return (
    <div className="space-y-5">
      <div
        onClick={() => setFlipped((f) => !f)}
        className="relative cursor-pointer mx-auto max-w-2xl"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "18rem",
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-card border border-border p-8 grid place-items-center text-center shadow-soft"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-primary mb-3">Question</p>
              <p className="text-xl font-display leading-snug">{card.front}</p>
              <p className="mt-6 text-xs text-muted-foreground">Tap to reveal</p>
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-primary text-primary-foreground p-8 grid place-items-center text-center shadow-glow"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80 mb-3">Answer</p>
              <p className="text-lg leading-relaxed">{card.back}</p>
            </div>
          </div>
        </div>
      </div>

      {flipped && !reviewed.has(i) && (
        <div className="flex justify-center gap-3 animate-fade-in">
          <Button variant="outline" onClick={() => grade(false)} className="border-destructive/60 text-destructive hover:bg-destructive/10">
            <X className="size-4 mr-2" /> Forgot (+10 XP)
          </Button>
          <Button onClick={() => grade(true)} className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Check className="size-4 mr-2" /> Got it (+25 XP)
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" onClick={() => go(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums w-24 text-center">
          {i + 1} / {cards.length} · {reviewed.size} reviewed
        </span>
        <Button variant="outline" size="icon" onClick={() => go(1)}>
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setFlipped((f) => !f)}>
          <RotateCw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
