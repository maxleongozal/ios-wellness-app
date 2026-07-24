/* ------------------------------------------------------------------ */
/* Moteur d'interventions contextuelles du Dr Sane — API publique.    */
/* Les textes vivent dans content/doctor-messages.ts ; les conditions */
/* dans situations.ts ; l'arbitrage et les plafonds dans engine.ts.   */
/* ------------------------------------------------------------------ */

export {
  consecutiveTrackedDays,
  consecutiveTrainingDays,
  daysSinceLastWorkout,
} from "./context";
export {
  MAX_INTERVENTIONS_PER_DAY,
  createEmptyHistory,
  recordShown,
  selectIntervention,
} from "./engine";
export { SITUATIONS } from "./situations";
export {
  loadInterventionHistory,
  resetInterventionHistory,
  saveInterventionHistory,
} from "./storage";
export type {
  DoctorIntervention,
  InterventionContext,
  InterventionDayContext,
  InterventionHistory,
  SituationMatch,
  SituationRule,
} from "./types";
