import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Swords, ScrollText, ChevronRight, Trophy, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PixelSprite } from "@/components/PixelSprite";
import { generateStoryMode, type StoryMode as Story } from "@/lib/story.functions";
import type { SpriteSpec } from "@/lib/pixel-sprite";
import { useProgress } from "@/hooks/use-progress";
import { toast } from "sonner";

type Props = { sourceText: string; title: string };

export function StoryMode({ sourceText, title }: Props) {
  const run = useServerFn(generateStoryMode);
  const { recordNoteRead } = useProgress();

  const [busy, setBusy] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [chapter, setChapter] = useState(0);
  const [scene, setScene] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [cleared, setCleared] = useState<Set<number>>(new Set());

  const generate = async () => {
    setBusy(true); setError(null);
    try {
      const result = await run({ data: { text: sourceText.slice(0, 80_000), title } });
      setStory(result);
      setChapter(0); setScene(0); setAnswered(null); setCleared(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't weave the story.");
    } finally {
      setBusy(false);
    }
  };

  const castBySpeaker = useMemo(() => {
    const map = new Map<string, Story["characters"][number]>();
    story?.characters.forEach((c) => map.set(c.name.toLowerCase(), c));
    return map;
  }, [story]);

  if (!story) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-card p-10 text-center">
        <div className="mx-auto mb-5 flex gap-2 justify-center">
          {["hero", "sage", "boss"].map((s) => (
            <PixelSprite key={s} seed={title + s} size={64} />
          ))}
        </div>
        <h3 className="font-display text-2xl font-semibold mb-2">Story Mode</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
          Turn this material into an 8-bit quest. Pixel characters born from your own PDF explain
          every topic, chapter by chapter — with checkpoints and XP, Habitica style.
        </p>
        <Button onClick={generate} disabled={busy} className="bg-gradient-primary text-primary-foreground">
          {busy ? <><Loader2 className="size-4 mr-2 animate-spin" /> Weaving your quest…</> : <><Sparkles className="size-4 mr-2" /> Begin the quest</>}
        </Button>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  const ch = story.chapters[chapter];
  const sc = ch.scenes[scene];
  const speaker = castBySpeaker.get(sc.speaker.toLowerCase());
  const atEnd = scene >= ch.scenes.length - 1;
  const isCleared = cleared.has(chapter);

  const spec = (c?: Story["characters"][number]): Partial<SpriteSpec> | undefined =>
    c ? (c as unknown as Partial<SpriteSpec>) : undefined;

  const answer = (i: number) => {
    if (answered !== null) return;
    setAnswered(i);
    if (i === ch.checkpoint.correctIndex) {
      if (!isCleared) {
        setCleared((s) => new Set(s).add(chapter));
        recordNoteRead();
        toast.success("Chapter cleared! +50 XP");
      }
    } else {
      toast.error("Not quite — read the scroll again, hero.");
    }
  };

  const nextChapter = () => {
    if (chapter < story.chapters.length - 1) {
      setChapter(chapter + 1); setScene(0); setAnswered(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* World header */}
      <div className="rounded-2xl border border-border bg-gradient-card p-6">
        <p className="text-xs uppercase tracking-widest text-primary mb-2">Story Mode</p>
        <h3 className="font-display text-2xl font-semibold mb-2">{story.title}</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">{story.world}</p>
      </div>

      {/* Party */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Your party</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {story.characters.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-background/40 p-3 text-center">
              <div className="flex justify-center mb-2">
                <PixelSprite seed={c.name} spec={spec(c)} size={64} />
              </div>
              <p className="font-semibold text-sm leading-tight">{c.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-primary mb-1">{c.role}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{c.concept}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chapter picker */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {story.chapters.map((c, i) => (
          <button
            key={i}
            onClick={() => { setChapter(i); setScene(0); setAnswered(null); }}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition ${
              i === chapter ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {cleared.has(i) ? "★ " : ""}Ch.{i + 1} · {c.title}
          </button>
        ))}
      </div>

      {/* Scene stage */}
      <div className="rounded-2xl border border-border bg-gradient-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <Swords className="size-4 text-primary" />
            <span className="font-semibold">{ch.title}</span>
            <span className="text-muted-foreground text-xs">— {ch.topic}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.min(scene + 1, ch.scenes.length)} / {ch.scenes.length}
          </span>
        </div>

        <div className="p-6 min-h-[220px] flex gap-5 items-start bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.12),transparent_60%)]">
          <div className="shrink-0">
            <PixelSprite seed={sc.speaker} spec={spec(speaker)} size={96} bob />
          </div>
          <div className="flex-1">
            {sc.narration && (
              <p className="text-xs italic text-muted-foreground mb-3">{sc.narration}</p>
            )}
            <p className="text-[11px] uppercase tracking-widest text-primary mb-1">{sc.speaker}</p>
            <p className="text-base leading-relaxed text-foreground/90">{sc.line}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => setScene(Math.max(0, scene - 1))} disabled={scene === 0}>
            Back
          </Button>
          {!atEnd ? (
            <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={() => setScene(scene + 1)}>
              Continue <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Scene complete — take the checkpoint below</span>
          )}
        </div>
      </div>

      {/* Lesson + checkpoint */}
      {atEnd && (
        <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <ScrollText className="size-3.5" /> Scroll of learning
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">{ch.lesson}</p>
          </div>

          <div>
            <p className="font-semibold mb-3">{ch.checkpoint.question}</p>
            <div className="grid gap-2">
              {ch.checkpoint.options.map((o, i) => {
                const correct = i === ch.checkpoint.correctIndex;
                const picked = answered === i;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={answered !== null}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      answered === null
                        ? "border-border hover:border-primary/50"
                        : correct
                          ? "border-primary bg-primary/10"
                          : picked
                            ? "border-destructive bg-destructive/10"
                            : "border-border opacity-60"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          {answered !== null && (
            <div className="flex items-center justify-between gap-3">
              {answered === ch.checkpoint.correctIndex ? (
                <p className="text-sm text-primary flex items-center gap-2">
                  <Trophy className="size-4" /> Chapter cleared!
                </p>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setAnswered(null); setScene(0); }}>
                  <RotateCcw className="size-4 mr-2" /> Replay chapter
                </Button>
              )}
              {chapter < story.chapters.length - 1 && (
                <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={nextChapter}>
                  Next chapter <ChevronRight className="size-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
