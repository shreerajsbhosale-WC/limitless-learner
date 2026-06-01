import { useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudyMaterials } from "@/lib/study.functions";

export function Quiz({ questions }: { questions: StudyMaterials["quiz"] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.reduce(
    (s, q, idx) => s + (answers[idx] === q.correctIndex ? 1 : 0),
    0,
  );

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {submitted && (
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 flex items-center justify-between shadow-glow">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Your score</p>
            <p className="font-display text-3xl font-bold">
              {score} / {questions.length}
            </p>
          </div>
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="size-4 mr-2" /> Retake
          </Button>
        </div>
      )}

      {questions.map((q, idx) => {
        const picked = answers[idx];
        return (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-gradient-card p-6"
          >
            <p className="font-display text-lg mb-4">
              <span className="text-primary mr-2">{idx + 1}.</span>
              {q.question}
            </p>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi;
                const isCorrect = q.correctIndex === oi;
                const showState = submitted;
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() =>
                      setAnswers((p) => ({ ...p, [idx]: oi }))
                    }
                    className={`text-left rounded-xl px-4 py-3 border transition-all flex items-center gap-3
                      ${
                        showState && isCorrect
                          ? "border-primary bg-primary/10 text-foreground"
                          : showState && isPicked && !isCorrect
                            ? "border-destructive bg-destructive/10"
                            : isPicked
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                  >
                    <span className="size-6 shrink-0 rounded-md border border-border grid place-items-center text-xs">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {showState && isCorrect && <Check className="size-4 text-primary" />}
                    {showState && isPicked && !isCorrect && <X className="size-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-4 text-sm text-muted-foreground border-l-2 border-primary pl-3">
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {!submitted && (
        <Button
          size="lg"
          className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
          disabled={Object.keys(answers).length !== questions.length}
          onClick={() => setSubmitted(true)}
        >
          Submit answers ({Object.keys(answers).length}/{questions.length})
        </Button>
      )}
    </div>
  );
}
