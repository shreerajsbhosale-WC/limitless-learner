import { useState } from "react";
import type { StudyMaterials } from "@/lib/study.functions";
import { useProgress } from "@/hooks/use-progress";

export function Notes({ notes, summary }: { notes: StudyMaterials["notes"]; summary: string }) {
  const { recordNoteRead } = useProgress();
  const [read, setRead] = useState<Set<number>>(new Set());

  const markRead = (i: number) => {
    if (read.has(i)) return;
    setRead((s) => new Set(s).add(i));
    recordNoteRead();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-card p-6">
        <p className="text-xs uppercase tracking-widest text-primary mb-2">Summary</p>
        <p className="text-base leading-relaxed text-foreground/90">{summary}</p>
      </div>
      <div className="grid gap-5">
        {notes.map((n, i) => {
          const isRead = read.has(i);
          return (
            <section
              key={i}
              onClick={() => markRead(i)}
              className={`rounded-2xl border bg-gradient-card p-6 cursor-pointer transition ${
                isRead ? "border-primary/60 shadow-glow" : "border-border hover:border-primary/40"
              }`}
            >
              <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-3">
                <span className="size-7 rounded-lg bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-bold">
                  {i + 1}
                </span>
                <span className="flex-1">{n.heading}</span>
                {isRead && <span className="text-[10px] uppercase tracking-wider text-primary">+50 XP ✓</span>}
              </h3>
              <ul className="space-y-2">
                {n.points.map((p, pi) => (
                  <li key={pi} className="flex gap-3 text-foreground/90 leading-relaxed">
                    <span className="text-primary mt-2 size-1.5 rounded-full bg-primary shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
