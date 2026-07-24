/* ------------------------------------------------------------------ */
/* Module de garde-fous SaneFit — API publique.                       */
/* Tous les seuils vivent dans config.ts (et uniquement là), chaque   */
/* valeur annotée [SOURCÉ] ou [HEURISTIQUE].                          */
/* ------------------------------------------------------------------ */

export {
  MEDICAL_DISCLAIMER,
  SAFETY_CONFIG,
  SAFETY_SOURCES,
  type SafetySource,
} from "./config";
export {
  bmiFloorKgFor,
  gainMaxKgPerWeekFor,
  lossMaxKgPerWeekFor,
  validateGoal,
  type GoalAssessment,
  type GoalInput,
} from "./goal-guard";
export {
  behaviorDaysFromGamification,
  detectBehaviorSignals,
  type BehaviorDay,
  type BehaviorLog,
  type GoalRevision,
} from "./behavior-watch";
export type { SafetyIntervention, SafetyInterventionKind } from "./types";
