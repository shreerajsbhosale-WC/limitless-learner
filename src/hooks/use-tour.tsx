import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { WelcomeVideo, hasSeenIntro, resetIntro } from "@/components/WelcomeVideo";

type TourCtx = { startTour: () => void };
const Ctx = createContext<TourCtx>({ startTour: () => {} });

export function useTour() {
  return useContext(Ctx);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenIntro()) {
      const t = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, []);

  const startTour = () => {
    resetIntro();
    setOpen(true);
  };

  return (
    <Ctx.Provider value={{ startTour }}>
      {children}
      <WelcomeVideo open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}
