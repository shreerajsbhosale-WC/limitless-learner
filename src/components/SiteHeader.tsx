import { Link } from "@tanstack/react-router";
import { Sparkles, Music, Workflow, MessageSquare, Library, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAnimeMode } from "@/hooks/use-anime-mode";
import { useMusicMode } from "@/hooks/use-music-mode";
import { useAuth } from "@/hooks/use-auth";
import { XpHud } from "./XpHud";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { enabled: animeOn, toggle: toggleAnime } = useAnimeMode();
  const { enabled: musicOn, toggle: toggleMusic } = useMusicMode();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/study" className="hover:text-foreground transition-colors">Study</Link>
          {user && (
            <>
              <Link to="/library" className="hover:text-foreground transition-colors flex items-center gap-1.5"><Library className="size-3.5" />Library</Link>
              <Link to="/assistant" className="hover:text-foreground transition-colors flex items-center gap-1.5"><MessageSquare className="size-3.5" />Assistant</Link>
              <Link to="/flowchart" className="hover:text-foreground transition-colors flex items-center gap-1.5"><Workflow className="size-3.5" />Flowcharts</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAnime} className={animeOn ? "border-primary text-primary" : ""} title="Toggle anime mode">
            <Sparkles className="size-4 md:mr-2" /><span className="hidden md:inline">{animeOn ? "Anime: On" : "Anime"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={toggleMusic} className={musicOn ? "border-primary text-primary" : ""} title="Toggle music mode">
            <Music className="size-4 md:mr-2" /><span className="hidden md:inline">{musicOn ? "Music: On" : "Music"}</span>
          </Button>
          <XpHud />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserIcon className="size-4" />
                  <span className="hidden md:inline max-w-[120px] truncate">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate max-w-[220px]">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/library">My library</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/assistant">AI Assistant</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/flowchart">Flowcharts</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="size-4 mr-2" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth"><LogIn className="size-4 md:mr-2" /><span className="hidden md:inline">Sign in</span></Link>
            </Button>
          )}
          <Button asChild variant="default" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            <Link to="/study">Start studying</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
