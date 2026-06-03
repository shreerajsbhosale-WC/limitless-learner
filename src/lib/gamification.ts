// Gamification core — pure logic, no React.

export const XP = {
  notesTopic: 50,
  flashReview: 10,
  flashCorrect: 15,
  quizAttempt: 100,
  quizCorrect: 20,
  quizPerfect: 250,
  bossVictory: 500,
  questBonus: 150,
} as const;

export const XP_PER_LEVEL = 1500;

export const TITLES = [
  { from: 1, name: "Novice" },
  { from: 5, name: "Apprentice" },
  { from: 10, name: "Scholar" },
  { from: 20, name: "Master" },
  { from: 35, name: "Sage" },
  { from: 50, name: "Limitless" },
];

export function levelFromXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
export function xpIntoLevel(xp: number) {
  return xp % XP_PER_LEVEL;
}
export function titleFor(level: number) {
  return [...TITLES].reverse().find((t) => level >= t.from)?.name ?? "Novice";
}

export type AchievementId =
  | "first_step"
  | "note_master"
  | "flash_champ"
  | "quiz_warrior"
  | "perfect_score"
  | "streak_7"
  | "boss_slayer"
  | "level_5"
  | "level_10"
  | "spaced_pro";

export interface AchievementDef {
  id: AchievementId;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_step", name: "First Step", desc: "Generate your first study kit", icon: "🌱" },
  { id: "note_master", name: "Note Master", desc: "Read 25 note topics", icon: "📓" },
  { id: "flash_champ", name: "Flashcard Champion", desc: "Review 100 flashcards", icon: "⚡" },
  { id: "quiz_warrior", name: "Quiz Warrior", desc: "Complete 10 quizzes", icon: "⚔️" },
  { id: "perfect_score", name: "Perfect Score", desc: "Ace a quiz with 100%", icon: "💯" },
  { id: "streak_7", name: "7-Day Streak", desc: "Study 7 days in a row", icon: "🔥" },
  { id: "boss_slayer", name: "Boss Slayer", desc: "Defeat your first boss", icon: "🐉" },
  { id: "level_5", name: "Rising Star", desc: "Reach level 5", icon: "⭐" },
  { id: "level_10", name: "Decade", desc: "Reach level 10", icon: "🌟" },
  { id: "spaced_pro", name: "Spaced Repetition Pro", desc: "Review cards on 3 separate days", icon: "🧠" },
];

export type QuestId = "study_notes" | "flash_sprint" | "quiz_challenge" | "perfect_quest";

export interface QuestDef {
  id: QuestId;
  name: string;
  desc: string;
  goal: number;
  xp: number;
  metric: "notesRead" | "flashReviewed" | "quizCompleted" | "perfectScore";
}

export const QUESTS: QuestDef[] = [
  { id: "study_notes", name: "Study Notes", desc: "Read 5 note topics today", goal: 5, xp: 150, metric: "notesRead" },
  { id: "flash_sprint", name: "Flashcard Sprint", desc: "Review 20 cards today", goal: 20, xp: 150, metric: "flashReviewed" },
  { id: "quiz_challenge", name: "Quiz Challenge", desc: "Complete 1 quiz today", goal: 1, xp: 200, metric: "quizCompleted" },
  { id: "perfect_quest", name: "Flawless Victory", desc: "Score 100% on a quiz today", goal: 1, xp: 300, metric: "perfectScore" },
];

export type Mastery = "new" | "attempted" | "familiar" | "proficient" | "mastered";
export function masteryFromAccuracy(reviewed: number, correct: number): Mastery {
  if (reviewed === 0) return "new";
  const r = correct / reviewed;
  if (reviewed >= 5 && r >= 0.95) return "mastered";
  if (reviewed >= 4 && r >= 0.8) return "proficient";
  if (reviewed >= 2 && r >= 0.6) return "familiar";
  return "attempted";
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function bossHpFor(questionCount: number) {
  return Math.max(500, questionCount * 100);
}
