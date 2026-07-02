import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileUp, Sparkles, Layers, BrainCircuit, Zap, Clock, Target, Timer, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
      <ScrollProgress />
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

          {/* 3D Layered Hero Illustration */}
          <div className="mt-24 mb-12 relative w-full max-w-4xl mx-auto [perspective:1200px]">
            <div className="absolute -top-10 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-10 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Main tilted dashboard */}
            <div className="relative mx-auto w-[85%] aspect-[16/10] rounded-2xl glass shadow-soft overflow-hidden [transform:rotateX(15deg)_rotateY(-5deg)]">
              <div className="flex gap-1.5 p-4 border-b border-border/50">
                <div className="size-2.5 rounded-full bg-destructive/40" />
                <div className="size-2.5 rounded-full bg-amber-500/40" />
                <div className="size-2.5 rounded-full bg-primary/40" />
              </div>
              <div className="p-8 grid grid-cols-2 gap-6 opacity-50">
                <div className="h-32 rounded-xl border border-border bg-foreground/5" />
                <div className="h-32 rounded-xl border border-border bg-foreground/5" />
                <div className="h-32 rounded-xl border border-border bg-foreground/5" />
                <div className="h-32 rounded-xl border border-border bg-foreground/5" />
              </div>
            </div>

            {/* Floating: Flashcards */}
            <div className="absolute top-1/4 -left-4 md:-left-8 w-60 p-5 rounded-2xl bg-card border border-primary/40 shadow-glow text-left [transform:translateZ(100px)_rotateY(10deg)_rotateX(-5deg)] animate-fade-in">
              <div className="size-10 rounded-lg bg-primary/15 grid place-items-center mb-4">
                <BrainCircuit className="size-5 text-primary" />
              </div>
              <p className="text-sm font-semibold">Flashcards</p>
              <p className="text-xs text-muted-foreground">14 cards · ready to review</p>
              <div className="mt-4 h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary rounded-full" />
              </div>
            </div>

            {/* Floating: Adaptive Quiz */}
            <div className="absolute -bottom-10 -right-4 md:-right-10 w-72 p-5 rounded-2xl bg-card border border-accent/40 shadow-soft text-left [transform:translateZ(150px)_rotateY(-15deg)] animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-lg bg-accent/15 grid place-items-center">
                  <Zap className="size-5 text-accent" />
                </div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Active</span>
              </div>
              <p className="text-sm font-semibold">Adaptive Quiz</p>
              <p className="text-xs text-muted-foreground mb-4">Analyzing focus areas…</p>
              <div className="flex gap-2">
                <div className="flex-1 h-8 rounded-md bg-foreground/5" />
                <div className="flex-1 h-8 rounded-md bg-primary/80" />
              </div>
            </div>

            {/* Floating: Notes summary */}
            <div className="absolute -top-10 right-8 md:right-16 w-56 p-4 rounded-xl glass text-left [transform:translateZ(80px)] animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="size-4 text-primary" />
                <p className="text-xs font-medium">Summary generated</p>
              </div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full bg-foreground/10 rounded" />
                <div className="h-1.5 w-4/5 bg-foreground/10 rounded" />
                <div className="h-1.5 w-full bg-foreground/10 rounded" />
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
              className="rounded-2xl border border-border bg-gradient-card p-6 hover:border-primary/50 transition-colors hover-lift"
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

      {/* Stats bento */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "10×", label: "Faster study prep" },
            { value: "50+", label: "Subjects supported" },
            { value: "98%", label: "Recall after a week" },
            { value: "1‑click", label: "PDF → study kit" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-gradient-card p-6 text-center hover-lift">
              <p className="font-display text-3xl md:text-4xl font-bold text-gradient">{s.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* More features bento */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Built like a complete <span className="text-gradient">study toolkit</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Target, title: "Habits", body: "Build daily study streaks with preset + custom habits.", to: "/habits" as const },
            { icon: Timer, title: "Focus timer", body: "Pomodoro sessions that earn XP while you grind.", to: "/focus" as const },
            { icon: MessageSquare, title: "AI assistant", body: "Ask anything — get answers grounded in your kits.", to: "/assistant" as const },
            { icon: Users, title: "Study groups", body: "Compete on the XP leaderboard with classmates.", to: "/groups" as const },
            { icon: Layers, title: "Library", body: "Every kit you've ever made, kept and searchable.", to: "/library" as const },
            { icon: Sparkles, title: "Exam mode", body: "1.5× XP and tighter quizzes when crunch time hits.", to: "/study" as const },
          ].map(({ icon: Icon, title, body, to }) => (
            <Link key={title} to={to} className="group rounded-2xl border border-border bg-gradient-card p-5 hover:border-primary/50 transition-colors hover-lift">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="size-5 text-primary" />
                <h3 className="font-display text-lg font-semibold">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{body}</p>
              <span className="story-link mt-3 inline-block text-xs text-primary">Open</span>
            </Link>
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
            <div key={step} className="rounded-2xl border border-border bg-gradient-card p-6 hover-lift">
              <p className="font-display text-5xl font-bold text-gradient mb-3">{step}</p>
              <Icon className="size-5 text-primary mb-2" />
              <h3 className="font-display text-xl font-semibold mb-1">{title}</h3>
              <p className="text-muted-foreground text-sm">{body}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Frequently asked</h2>
            <p className="text-muted-foreground mt-2 text-sm">Quick answers to the things students ask most.</p>
          </div>
          <Accordion type="single" collapsible className="rounded-2xl border border-border bg-gradient-card px-6">
            <AccordionItem value="q1">
              <AccordionTrigger>Is Limitless free?</AccordionTrigger>
              <AccordionContent>Yes — you can upload PDFs and generate study kits without paying.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Do I need an account?</AccordionTrigger>
              <AccordionContent>You can try it as a guest. Sign in with Google to save your kits, habits, and XP across devices.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>What can I upload?</AccordionTrigger>
              <AccordionContent>PDFs, pasted text, video links, and your own notes — Limitless turns any of them into a kit.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>How is my data used?</AccordionTrigger>
              <AccordionContent>Your uploads are only used to generate your study kit. We don't sell or train public models on your content.</AccordionContent>
            </AccordionItem>
          </Accordion>
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
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Limitless. Study without limits.</p>
          <a
            href="https://discord.gg/P2dR47DVf9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 hover:text-primary transition-colors"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.36-.42.83-.58 1.22a18.27 18.27 0 0 0-5.96 0C9.86 3.83 9.63 3.36 9.43 3a19.74 19.74 0 0 0-3.77 1.37C2.02 9.79 1.02 15.06 1.52 20.25a19.9 19.9 0 0 0 6.03 3.05c.48-.66.91-1.36 1.28-2.1-.7-.26-1.37-.58-2-.96.17-.12.33-.25.49-.38 3.87 1.79 8.06 1.79 11.88 0 .16.13.32.26.49.38-.63.38-1.31.7-2 .96.37.74.8 1.44 1.28 2.1a19.86 19.86 0 0 0 6.03-3.05c.58-6.03-1-11.25-4.68-15.88ZM8.68 15.33c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.2 0 2.17 1.09 2.15 2.42 0 1.33-.95 2.42-2.15 2.42Zm6.64 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.2 0 2.17 1.09 2.15 2.42 0 1.33-.95 2.42-2.15 2.42Z"/></svg>
            Join our Discord
          </a>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
