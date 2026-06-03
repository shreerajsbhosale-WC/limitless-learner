import { Link } from "@tanstack/react-router";
import { Sparkles, Music } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAnimeMode } from "@/hooks/use-anime-mode";
import { useMusicMode } from "@/hooks/use-music-mode";
import { XpHud } from "./XpHud";

export function SiteHeader() {
  const { enabled: animeOn, toggle: toggleAnime } = useAnimeMode();
  const { enabled: musicOn, toggle: toggleMusic } = useMusicMode();
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
            onClick={toggleAnime}
            className={animeOn ? "border-primary text-primary" : ""}
            aria-pressed={animeOn}
            title="Toggle anime mode"
          >
            <Sparkles className="size-4 mr-2" />
            {animeOn ? "Anime: On" : "Anime mode"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMusic}
            className={musicOn ? "border-primary text-primary" : ""}
            aria-pressed={musicOn}
            title="Toggle music mode"
          >
            <Music className="size-4 mr-2" />
            {musicOn ? "Music: On" : "Music mode"}
          </Button>
          <Button asChild variant="default" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            <Link to="/study">Start studying</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
