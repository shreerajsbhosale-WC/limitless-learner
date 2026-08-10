import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, Gauge, Maximize2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "limitless.intro.seen.v1";
export const INTRO_SRC = "/media/limitless-intro.mp4";

/** Chapter markers matching the scenes in the intro video. */
export const CHAPTERS = [
  { t: 0, label: "Welcome" },
  { t: 2.9, label: "Upload anything" },
  { t: 7.2, label: "Your study kit" },
  { t: 10.8, label: "Student tools" },
  { t: 14.7, label: "XP & streaks" },
  { t: 18.5, label: "Guided tour" },
  { t: 22.4, label: "Get started" },
] as const;

const SPEEDS = [1, 1.25, 1.5, 2] as const;

export function hasSeenIntro() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "1";
}
export function markIntroSeen() {
  localStorage.setItem(STORAGE_KEY, "1");
}
export function resetIntro() {
  localStorage.removeItem(STORAGE_KEY);
}

export function WelcomeVideo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    markIntroSeen();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const seek = (t: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = t;
    void v.play();
    setPlaying(true);
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]!;
    setSpeed(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  if (!open || !mounted) return null;

  const pct = duration ? (time / duration) * 100 : 0;
  const activeChapter = CHAPTERS.reduce((acc, c, i) => (time >= c.t ? i : acc), 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Getting started video"
    >
        <div className="w-full max-w-4xl rounded-2xl border bg-card shadow-xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div>
              <h2 className="font-display font-semibold">Getting started with Limitless</h2>
              <p className="text-xs text-muted-foreground">A 26-second tour of every feature.</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={close} className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1">
                <LogOut className="size-3.5" />
                Exit tour
              </Button>
              <button onClick={close} aria-label="Close video" className="text-muted-foreground hover:text-foreground p-1">
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div
            className="relative bg-black group cursor-pointer"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={toggle}
          >
            <video
              ref={ref}
              src={INTRO_SRC}
              className="w-full aspect-video"
              autoPlay
              muted={muted}
              playsInline
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onEnded={() => setPlaying(false)}
            />
            {/* centered play/pause overlay */}
            {(hovering || !playing) && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none transition-opacity duration-200">
                <div className={`rounded-full bg-black/60 backdrop-blur-sm p-4 transition-transform duration-200 ${playing ? "scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100" : "scale-100 opacity-100"}`}>
                  {playing ? (
                    <Pause className="size-10 text-white" />
                  ) : (
                    <Play className="size-10 text-white ml-1" />
                  )}
                </div>
              </div>
            )}
            {/* progress + chapter markers */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * duration);
            }}
          >
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            {CHAPTERS.map((c) => (
              <span
                key={c.label}
                className="absolute top-0 h-full w-0.5 bg-white/60"
                style={{ left: `${duration ? (c.t / duration) * 100 : 0}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b">
          <Button size="icon" variant="ghost" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setMuted((m) => !m)} aria-label="Toggle sound">
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => seek(0)} aria-label="Restart">
            <RotateCcw className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cycleSpeed} aria-label="Playback speed">
            <Gauge className="size-4 mr-1" />
            {speed}x
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => ref.current?.requestFullscreen?.()}
            aria-label="Fullscreen"
          >
            <Maximize2 className="size-4" />
          </Button>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {fmt(time)} / {fmt(duration)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 px-4 py-3">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.label}
              onClick={() => seek(c.t)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                i === activeChapter
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
          <Button size="sm" className="ml-auto bg-gradient-primary text-primary-foreground" onClick={close}>
            Start learning
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function fmt(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
