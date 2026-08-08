import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TourStep = {
  id: string;
  /** CSS selector for the element to highlight. Omit for a centered dialog. */
  target?: string;
  title: string;
  body: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Limitless 👋",
    body: "Quick tour: 60 seconds to see everything this app can do for your studying.",
  },
  {
    id: "dashboard",
    target: '[data-tour="nav-dashboard"]',
    title: "Your dashboard",
    body: "Your home base — study kits, XP, streaks, weekly activity and daily goals all live here.",
  },
  {
    id: "study",
    target: '[data-tour="nav-study"]',
    title: "Create a study kit",
    body: "Upload a PDF, paste your own notes, or drop a video link. Limitless turns it into notes, flashcards and a practice test.",
  },
  {
    id: "stats",
    target: '[data-tour="stats"]',
    title: "Track your progress",
    body: "Kits made, hours learned, total XP and your current streak — updated as you study.",
  },
  {
    id: "kits",
    target: '[data-tour="continue"]',
    title: "Continue learning",
    body: "Pick up any kit exactly where you left off. Hover a card to delete it.",
  },
  {
    id: "goals",
    target: '[data-tour="daily-goal"]',
    title: "Daily goals & achievements",
    body: "Small daily targets keep the streak alive and earn badges as you go.",
  },
  {
    id: "habits",
    target: '[data-tour="nav-habits"]',
    title: "Habits",
    body: "Build study routines and check them off daily to protect your streak.",
  },
  {
    id: "focus",
    target: '[data-tour="nav-focus"]',
    title: "Focus timer",
    body: "Pomodoro sessions with lofi music — focused time earns XP.",
  },
  {
    id: "weekly",
    target: '[data-tour="nav-weekly"]',
    title: "Weekly report",
    body: "A summary of what you studied, where you improved, and what to revisit.",
  },
  {
    id: "assistant",
    target: '[data-tour="nav-assistant"]',
    title: "AI assistant",
    body: "Ask anything about your material and get it explained at your level.",
  },
  {
    id: "groups",
    target: '[data-tour="nav-groups"]',
    title: "Groups & leaderboards",
    body: "Study with friends and compete on XP leaderboards.",
  },
  {
    id: "flowchart",
    target: '[data-tour="nav-flowchart"]',
    title: "Flowcharts",
    body: "Turn any topic into a visual diagram to see how the concepts connect.",
  },
  {
    id: "done",
    title: "You're all set 🚀",
    body: "Start by creating your first study kit. You can replay this tour anytime from the sidebar.",
  },
];

const STORAGE_KEY = "limitless.tour.completed.v1";

type Rect = { top: number; left: number; width: number; height: number };

export function OnboardingTour({
  open,
  onClose,
  steps = TOUR_STEPS,
}: {
  open: boolean;
  onClose: () => void;
  steps?: TourStep[];
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step?.target) return setRect(null);
    const el = document.querySelector(step.target);
    if (!el) return setRect(null);
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const t = window.setTimeout(measure, 320);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) {
      localStorage.setItem(STORAGE_KEY, "1");
      onClose();
    } else setIndex((i) => i + 1);
  }, [index, steps.length, onClose]);

  const skip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, skip]);

  if (!open || !mounted || !step) return null;

  const pad = 8;
  const spot = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Card placement: below the target if there's room, otherwise above; centered when no target.
  const cardWidth = 340;
  let cardStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: cardWidth,
  };
  if (spot) {
    const below = spot.top + spot.height + 14;
    const fitsBelow = below + 200 < window.innerHeight;
    const top = fitsBelow ? below : Math.max(16, spot.top - 214);
    const left = Math.min(
      Math.max(16, spot.left + spot.width / 2 - cardWidth / 2),
      Math.max(16, window.innerWidth - cardWidth - 16),
    );
    cardStyle = { top, left, width: cardWidth };
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Product tour">
      {spot ? (
        <div
          className="absolute rounded-xl ring-2 ring-primary transition-all duration-300 pointer-events-none"
          style={{
            ...spot,
            boxShadow: "0 0 0 9999px rgba(2,6,23,0.72)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      )}

      <div
        className="absolute rounded-2xl border bg-card p-5 shadow-xl animate-scale-in"
        style={cardStyle}
      >
        <button
          onClick={skip}
          aria-label="Close tour"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-primary mb-2">
          <Sparkles className="size-3.5" />
          Step {index + 1} of {steps.length}
        </div>
        <h3 className="font-display text-lg font-semibold pr-6">{step.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>

        <div className="mt-4 flex items-center gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={skip}>
            Skip tour
          </Button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
            )}
            <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={next}>
              {index === steps.length - 1 ? "Finish" : "Next"}
              {index < steps.length - 1 && <ArrowRight className="size-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function hasCompletedTour() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function resetTour() {
  localStorage.removeItem(STORAGE_KEY);
}
