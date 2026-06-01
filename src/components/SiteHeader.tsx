import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAnimeMode } from "@/hooks/use-anime-mode";

export function SiteHeader() {
  const { enabled, toggle } = useAnimeMode();
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/#how" className="hover:text-foreground transition-colors">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            className={enabled ? "border-primary text-primary" : ""}
            aria-pressed={enabled}
            title="Toggle anime mode"
          >
            <Sparkles className="size-4 mr-2" />
            {enabled ? "Anime: On" : "Anime mode"}
          </Button>
          <Button asChild variant="default" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            <Link to="/study">Start studying</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
