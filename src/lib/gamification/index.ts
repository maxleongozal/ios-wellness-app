/* ------------------------------------------------------------------ */
/* Module de gamification SaneFit — API publique.                     */
/* Charte : on gamifie les comportements, JAMAIS les résultats        */
/* corporels. Voir l'en-tête de rules.ts avant toute modification.    */
/* ------------------------------------------------------------------ */

export {
  ACTIVE_DAYS_TARGET,
  BADGES,
  GAMIFICATION_RULES,
  JOKERS_PER_MONTH,
  LEVELS,
  SLEEP_TARGET_HOURS,
  WORKOUT_REST_POINTS,
  type BadgeDefinition,
  type GamificationRule,
  type LessonDefinition,
  type LevelDefinition,
} from "./rules";
export {
  createInitialState,
  getLevel,
  getNextLevel,
  getUnlockedLessons,
  getWeekProgress,
  isoWeekKey,
  recordDay,
  type WeekProgress,
} from "./engine";
export {
  loadGamificationState,
  resetGamification,
  saveGamificationState,
} from "./storage";
export type {
  DailyActivity,
  DayRecord,
  GamificationState,
  LifetimeCounters,
  WeekOutcome,
  WeekRecord,
} from "./types";
