import { Link } from "@tanstack/react-router";
import { Music, Workflow, MessageSquare, Library, LogIn, LogOut, User as UserIcon, Target, Timer, BarChart3, Users, GraduationCap, BookOpen } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useMusicMode } from "@/hooks/use-music-mode";
import { useExamMode } from "@/hooks/use-exam-mode";
import { useAuth } from "@/hooks/use-auth";
import { XpHud } from "./XpHud";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { enabled: musicOn, toggle: toggleMusic } = useMusicMode();
  const { enabled: examOn, toggle: toggleExam } = useExamMode();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2 ml-auto">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Toggle exam mode" variant="outline" size="sm" onClick={toggleExam} className={examOn ? "border-destructive text-destructive" : ""}>
                  <GraduationCap className="size-4 md:mr-2" /><span className="hidden md:inline">{examOn ? "Exam: On" : "Exam"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exam mode — 1.5× XP, tighter quizzes</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Toggle music mode" variant="outline" size="sm" onClick={toggleMusic} className={musicOn ? "border-primary text-primary" : ""}>
                  <Music className="size-4 md:mr-2" /><span className="hidden md:inline">{musicOn ? "Music: On" : "Music"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Music mode — plays lofi radio & adds music analogies to notes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                <DropdownMenuItem asChild><Link to="/study"><BookOpen className="size-4 mr-2" />Study</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/library"><Library className="size-4 mr-2" />My library</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/habits"><Target className="size-4 mr-2" />Habits</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/focus"><Timer className="size-4 mr-2" />Focus timer</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/weekly"><BarChart3 className="size-4 mr-2" />Weekly report</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/groups"><Users className="size-4 mr-2" />Study groups</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/assistant"><MessageSquare className="size-4 mr-2" />AI Assistant</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/flowchart"><Workflow className="size-4 mr-2" />Flowcharts</Link></DropdownMenuItem>
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
