import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ACHIEVEMENTS,
  QUESTS,
  XP,
  XP_PER_LEVEL,
  levelFromXp,
  titleFor,
  todayKey,
  type AchievementId,
  type QuestId,
} from "@/lib/gamification";

const STORAGE_KEY = "limitless-progress-v1";

interface DailyCounters {
  date: string;
  notesRead: number;
  flashReviewed: number;
  flashCorrect: number;
  quizCompleted: number;
  perfectScore: number;
  claimedQuests: QuestId[];
}

export interface ProgressState {
  xp: number;
  achievements: AchievementId[];
  streak: number;
  lastStudyDay: string | null;
  daysStudied: string[]; // for spaced repetition pro
  totals: {
    kitsGenerated: number;
    notesRead: number;
    flashReviewed: number;
    flashCorrect: number;
    quizzesCompleted: number;
    bossesDefeated: number;
  };
  daily: DailyCounters;
}

const initial: ProgressState = {
  xp: 0,
  achievements: [],
  streak: 0,
  lastStudyDay: null,
  daysStudied: [],
  totals: {
    kitsGenerated: 0,
    notesRead: 0,
    flashReviewed: 0,
    flashCorrect: 0,
    quizzesCompleted: 0,
    bossesDefeated: 0,
  },
  daily: { date: todayKey(), notesRead: 0, flashReviewed: 0, flashCorrect: 0, quizCompleted: 0, perfectScore: 0, claimedQuests: [] },
};

function load(): ProgressState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.daily.date !== todayKey()) {
      parsed.daily = { ...initial.daily, date: todayKey() };
    }
    return { ...initial, ...parsed, daily: { ...initial.daily, ...parsed.daily } };
  } catch {
    return initial;
  }
}

interface Ctx {
  state: ProgressState;
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForLevel: number;
  award: (amount: number, reason?: string) => void;
  recordKitGenerated: () => void;
  recordNoteRead: () => void;
  recordFlashReview: (correct: boolean) => void;
  recordQuiz: (correctCount: number, total: number) => { perfect: boolean; xpAwarded: number };
  recordBossWin: () => void;
  claimQuest: (id: QuestId) => void;
  reset: () => void;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const unlock = useCallback((id: AchievementId, next: ProgressState): ProgressState => {
    if (next.achievements.includes(id)) return next;
    const def = ACHIEVEMENTS.find((a) => a.id === id)!;
    setTimeout(() => toast.success(`${def.icon} Achievement: ${def.name}`, { description: def.desc }), 0);
    return { ...next, achievements: [...next.achievements, id] };
  }, []);

  const checkAchievements = useCallback(
    (s: ProgressState): ProgressState => {
      let next = s;
      const lvl = levelFromXp(s.xp);
      if (s.totals.kitsGenerated >= 1) next = unlock("first_step", next);
      if (s.totals.notesRead >= 25) next = unlock("note_master", next);
      if (s.totals.flashReviewed >= 100) next = unlock("flash_champ", next);
      if (s.totals.quizzesCompleted >= 10) next = unlock("quiz_warrior", next);
      if (s.totals.bossesDefeated >= 1) next = unlock("boss_slayer", next);
      if (lvl >= 5) next = unlock("level_5", next);
      if (lvl >= 10) next = unlock("level_10", next);
      if (s.streak >= 7) next = unlock("streak_7", next);
      if (s.daysStudied.length >= 3) next = unlock("spaced_pro", next);
      return next;
    },
    [unlock],
  );

  const touchStudyDay = useCallback((s: ProgressState): ProgressState => {
    const today = todayKey();
    if (s.lastStudyDay === today) return s;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    // Mercy: if 2 days ago and we still have a freeze token this week, preserve streak
    const twoAgo = new Date(); twoAgo.setDate(twoAgo.getDate() - 2);
    const t2Key = `${twoAgo.getFullYear()}-${twoAgo.getMonth() + 1}-${twoAgo.getDate()}`;
    let streak: number;
    if (s.lastStudyDay === yKey) streak = s.streak + 1;
    else if (s.lastStudyDay === t2Key && s.streak > 0) {
      setTimeout(() => toast("🛡️ Streak freeze used", { description: "We saved your streak from yesterday's miss." }), 0);
      streak = s.streak + 1;
    } else streak = 1;
    const daysStudied = s.daysStudied.includes(today) ? s.daysStudied : [...s.daysStudied, today].slice(-30);
    return { ...s, lastStudyDay: today, streak, daysStudied };
  }, []);

  const award = useCallback(
    (amount: number, reason?: string) => {
      if (!amount) return;
      const examOn = typeof window !== "undefined" && localStorage.getItem("limitless-exam-mode") === "1";
      const final = examOn ? Math.round(amount * 1.5) : amount;
      setState((s) => {
        const prevLvl = levelFromXp(s.xp);
        let next: ProgressState = { ...s, xp: s.xp + final };
        next = touchStudyDay(next);
        const newLvl = levelFromXp(next.xp);
        if (newLvl > prevLvl) {
          setTimeout(() => toast.success(`✨ Level up! ${titleFor(newLvl)} — Lv ${newLvl}`, { description: `+${final} XP${reason ? ` · ${reason}` : ""}${examOn ? " · Exam bonus" : ""}` }), 0);
        } else if (reason) {
          setTimeout(() => toast(`+${final} XP${examOn ? " (Exam x1.5)" : ""}`, { description: reason }), 0);
        }
        return checkAchievements(next);
      });
    },
    [checkAchievements, touchStudyDay],
  );


  const recordKitGenerated = useCallback(() => {
    setState((s) => checkAchievements({ ...s, totals: { ...s.totals, kitsGenerated: s.totals.kitsGenerated + 1 } }));
  }, [checkAchievements]);

  const recordNoteRead = useCallback(() => {
    setState((s) => {
      const next = touchStudyDay({
        ...s,
        xp: s.xp + XP.notesTopic,
        totals: { ...s.totals, notesRead: s.totals.notesRead + 1 },
        daily: { ...s.daily, notesRead: s.daily.notesRead + 1 },
      });
      return checkAchievements(next);
    });
  }, [checkAchievements, touchStudyDay]);

  const recordFlashReview = useCallback(
    (correct: boolean) => {
      setState((s) => {
        const xpGain = XP.flashReview + (correct ? XP.flashCorrect : 0);
        const next = touchStudyDay({
          ...s,
          xp: s.xp + xpGain,
          totals: {
            ...s.totals,
            flashReviewed: s.totals.flashReviewed + 1,
            flashCorrect: s.totals.flashCorrect + (correct ? 1 : 0),
          },
          daily: {
            ...s.daily,
            flashReviewed: s.daily.flashReviewed + 1,
            flashCorrect: s.daily.flashCorrect + (correct ? 1 : 0),
          },
        });
        return checkAchievements(next);
      });
    },
    [checkAchievements, touchStudyDay],
  );

  const recordQuiz = useCallback(
    (correctCount: number, total: number) => {
      const perfect = total > 0 && correctCount === total;
      const xpAwarded = XP.quizAttempt + correctCount * XP.quizCorrect + (perfect ? XP.quizPerfect : 0);
      setState((s) => {
        const prevLvl = levelFromXp(s.xp);
        let next: ProgressState = {
          ...s,
          xp: s.xp + xpAwarded,
          totals: { ...s.totals, quizzesCompleted: s.totals.quizzesCompleted + 1 },
          daily: {
            ...s.daily,
            quizCompleted: s.daily.quizCompleted + 1,
            perfectScore: s.daily.perfectScore + (perfect ? 1 : 0),
          },
        };
        next = touchStudyDay(next);
        if (perfect) next = unlock("perfect_score", next);
        const newLvl = levelFromXp(next.xp);
        if (newLvl > prevLvl) {
          setTimeout(() => toast.success(`✨ Level up! ${titleFor(newLvl)} — Lv ${newLvl}`), 0);
        }
        return checkAchievements(next);
      });
      return { perfect, xpAwarded };
    },
    [checkAchievements, touchStudyDay, unlock],
  );

  const recordBossWin = useCallback(() => {
    setState((s) => {
      const prevLvl = levelFromXp(s.xp);
      let next: ProgressState = {
        ...s,
        xp: s.xp + XP.bossVictory,
        totals: { ...s.totals, bossesDefeated: s.totals.bossesDefeated + 1 },
      };
      next = touchStudyDay(next);
      const newLvl = levelFromXp(next.xp);
      if (newLvl > prevLvl) {
        setTimeout(() => toast.success(`✨ Level up! ${titleFor(newLvl)} — Lv ${newLvl}`), 0);
      }
      return checkAchievements(next);
    });
  }, [checkAchievements, touchStudyDay]);

  const claimQuest = useCallback(
    (id: QuestId) => {
      setState((s) => {
        if (s.daily.claimedQuests.includes(id)) return s;
        const q = QUESTS.find((x) => x.id === id);
        if (!q) return s;
        const progress = s.daily[q.metric];
        if (progress < q.goal) return s;
        setTimeout(() => toast.success(`🎁 Quest complete: ${q.name}`, { description: `+${q.xp} XP` }), 0);
        return checkAchievements({
          ...s,
          xp: s.xp + q.xp,
          daily: { ...s.daily, claimedQuests: [...s.daily.claimedQuests, id] },
        });
      });
    },
    [checkAchievements],
  );

  const reset = useCallback(() => setState(initial), []);

  const value: Ctx = useMemo(
    () => ({
      state,
      level: levelFromXp(state.xp),
      title: titleFor(levelFromXp(state.xp)),
      xpIntoLevel: state.xp % XP_PER_LEVEL,
      xpForLevel: XP_PER_LEVEL,
      award,
      recordKitGenerated,
      recordNoteRead,
      recordFlashReview,
      recordQuiz,
      recordBossWin,
      claimQuest,
      reset,
    }),
    [state, award, recordKitGenerated, recordNoteRead, recordFlashReview, recordQuiz, recordBossWin, claimQuest, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
