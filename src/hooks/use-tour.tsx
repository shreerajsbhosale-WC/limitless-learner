import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { OnboardingTour, hasCompletedTour, resetTour } from "@/components/OnboardingTour";

type TourCtx = { startTour: () => void };
const Ctx = createContext<TourCtx>({ startTour: () => {} });

export function useTour() {
  return useContext(Ctx);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasCompletedTour()) {
      const t = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, []);

  const startTour = () => {
    resetTour();
    setOpen(true);
  };

  return (
    <Ctx.Provider value={{ startTour }}>
      {children}
      <OnboardingTour open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}
