import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileUp, Sparkles, Layers, BrainCircuit, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Limitless — Turn any PDF into notes, flashcards & quizzes" },
      {
        name: "description",
        content:
          "Upload a PDF and Limitless instantly generates structured notes, flashcards, and practice tests so you can study smarter.",
      },
      { property: "og:title", content: "Limitless — Study without limits" },
      {
        property: "og:description",
        content:
          "Upload a PDF and Limitless instantly generates notes, flashcards, and quizzes.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground mb-8">
            <Sparkles className="size-3.5 text-primary" />
            AI-powered study companion
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Study without <span className="text-gradient">limits.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Drop in any PDF and get structured notes, flashcards, and a
            practice test in seconds. Built for students who want to learn
            faster, not harder.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow h-12 px-7 text-base"
            >
              <Link to="/study">
                Upload your first PDF <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <a href="#features">See how it works</a>
            </Button>
          </div>

          {/* Visual mock */}
          <div className="mt-16 relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-3xl glass p-2 shadow-soft">
              <div className="rounded-2xl bg-card p-8 text-left">
                <div className="flex items-center gap-2 mb-6">
                  <div className="size-2.5 rounded-full bg-destructive/60" />
                  <div className="size-2.5 rounded-full bg-primary/60" />
                  <div className="size-2.5 rounded-full bg-accent/60" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: Layers, label: "Notes", body: "5 sections · 28 key points" },
                    { icon: BrainCircuit, label: "Flashcards", body: "14 cards · ready to review" },
                    { icon: Zap, label: "Quiz", body: "10 questions · explained" },
                  ].map(({ icon: Icon, label, body }) => (
                    <div key={label} className="rounded-xl border border-border bg-background/40 p-4">
                      <Icon className="size-5 text-primary mb-2" />
                      <p className="font-semibold">{label}</p>
                      <p className="text-sm text-muted-foreground">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Everything you need from one upload
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Stop juggling tools. Limitless turns your study material into a
            complete learning kit.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Layers,
              title: "Structured notes",
              body: "Clean sections with headings and bullet points. Skim, study, or print.",
            },
            {
              icon: BrainCircuit,
              title: "Smart flashcards",
              body: "Auto-generated Q&A cards you can flip through and memorize.",
            },
            {
              icon: Zap,
              title: "Practice quizzes",
              body: "Multiple-choice questions with explanations — test what you actually know.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-gradient-card p-6 hover:border-primary/50 transition-colors"
            >
              <div className="size-11 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground mb-4 shadow-glow">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Three steps. One smarter you.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: FileUp, step: "01", title: "Upload", body: "Drop in any PDF — lecture, textbook, paper, slides." },
            { icon: Clock, step: "02", title: "Wait briefly", body: "Limitless reads it and crafts your study kit." },
            { icon: Sparkles, step: "03", title: "Study", body: "Notes, flashcards, and quizzes — all in one place." },
          ].map(({ icon: Icon, step, title, body }) => (
            <div key={step} className="rounded-2xl border border-border bg-gradient-card p-6">
              <p className="font-display text-5xl font-bold text-gradient mb-3">{step}</p>
              <Icon className="size-5 text-primary mb-2" />
              <h3 className="font-display text-xl font-semibold mb-1">{title}</h3>
              <p className="text-muted-foreground text-sm">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-gradient-primary p-10 md:p-14 text-center shadow-glow">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
            Ready to learn the limitless way?
          </h2>
          <p className="text-primary-foreground/80 mt-3 max-w-xl mx-auto">
            Free to try. Bring a PDF and we'll do the rest.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-6 h-12 px-7 text-base"
          >
            <Link to="/study">
              Start studying <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border mt-10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Limitless. Study without limits.
        </div>
      </footer>
    </div>
  );
}
