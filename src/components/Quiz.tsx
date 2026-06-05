import { useState } from "react";
import { Check, X, RotateCcw, Swords, Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import type { StudyMaterials } from "@/lib/study.functions";
import { explainMistake } from "@/lib/study.functions";
import { useProgress } from "@/hooks/use-progress";
import { BossBattle } from "./BossBattle";

export function Quiz({ questions, topic }: { questions: StudyMaterials["quiz"]; topic: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [bossOpen, setBossOpen] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const { recordQuiz, recordBossWin } = useProgress();
  const explain = useServerFn(explainMistake);

  const score = questions.reduce((s, q, idx) => s + (answers[idx] === q.correctIndex ? 1 : 0), 0);

  const reset = () => { setAnswers({}); setSubmitted(false); setExplanations({}); };
  const submit = () => {
    setSubmitted(true);
    const result = recordQuiz(score, questions.length);
    setXpAwarded(result.xpAwarded);
    setBossOpen(true);
  };
  const closeBoss = () => {
    if (score / Math.max(1, questions.length) >= 0.7) recordBossWin();
    setBossOpen(false);
  };

  const askExplain = async (idx: number) => {
    const q = questions[idx];
    setLoadingIdx(idx);
    try {
      const res = await explain({ data: {
        question: q.question,
        correct: q.options[q.correctIndex],
        picked: q.options[answers[idx]],
      }});
      setExplanations((p) => ({ ...p, [idx]: res.explanation }));
    } finally { setLoadingIdx(null); }
  };

  return (
    <div className="space-y-6">
      {submitted && (
        <div className="rounded-2xl bg-gradient-primary text-primary-foreground p-6 flex items-center justify-between shadow-glow">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Your score</p>
            <p className="font-display text-3xl font-bold">{score} / {questions.length}</p>
            <p className="text-sm opacity-80 mt-1">+{xpAwarded} XP earned</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setBossOpen(true)}><Swords className="size-4 mr-2" />Boss</Button>
            <Button variant="secondary" onClick={reset}><RotateCcw className="size-4 mr-2" />Retake</Button>
          </div>
        </div>
      )}

      {questions.map((q, idx) => {
        const picked = answers[idx];
        const wrong = submitted && picked !== q.correctIndex && picked !== undefined;
        return (
          <div key={idx} className="rounded-2xl border border-border bg-gradient-card p-6">
            <p className="font-display text-lg mb-4"><span className="text-primary mr-2">{idx + 1}.</span>{q.question}</p>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi;
                const isCorrect = q.correctIndex === oi;
                return (
                  <button key={oi} disabled={submitted} onClick={() => setAnswers((p) => ({ ...p, [idx]: oi }))}
                    className={`text-left rounded-xl px-4 py-3 border transition-all flex items-center gap-3
                      ${submitted && isCorrect ? "border-primary bg-primary/10 text-foreground" :
                        submitted && isPicked && !isCorrect ? "border-destructive bg-destructive/10" :
                        isPicked ? "border-primary bg-primary/5" :
                        "border-border hover:border-primary/50 hover:bg-secondary/50"}`}>
                    <span className="size-6 shrink-0 rounded-md border border-border grid place-items-center text-xs">{String.fromCharCode(65 + oi)}</span>
                    <span className="flex-1">{opt}</span>
                    {submitted && isCorrect && <Check className="size-4 text-primary" />}
                    {submitted && isPicked && !isCorrect && <X className="size-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <>
                <p className="mt-4 text-sm text-muted-foreground border-l-2 border-primary pl-3">{q.explanation}</p>
                {wrong && !explanations[idx] && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => askExplain(idx)} disabled={loadingIdx === idx}>
                    {loadingIdx === idx ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
                    AI: explain my mistake
                  </Button>
                )}
                {explanations[idx] && (
                  <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm whitespace-pre-wrap">{explanations[idx]}</div>
                )}
              </>
            )}
          </div>
        );
      })}

      {!submitted && (
        <Button size="lg" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
          disabled={Object.keys(answers).length !== questions.length} onClick={submit}>
          <Swords className="size-4 mr-2" />
          Submit & face the boss ({Object.keys(answers).length}/{questions.length})
        </Button>
      )}

      {bossOpen && <BossBattle topic={topic} correct={score} total={questions.length} xpAwarded={xpAwarded} onClose={closeBoss} />}
    </div>
  );
}
