import type { GamificationState } from "@/lib/gamification";

/* ------------------------------------------------------------------ */
/* Lectures du journal de gamification pour le contexte du Dr Sane.   */
/* Fonctions pures : la date du jour est fournie en entrée.           */
/* Le journal gamification est la seule source d'historique de        */
/* comportement du prototype — pas de second journal parallèle.       */
/* ------------------------------------------------------------------ */

function shiftDate(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

const trainedOn = (state: GamificationState, date: string): boolean =>
  (state.days[date]?.actions["seance_terminee"] ?? 0) > 0;

/**
 * Jours d'entraînement consécutifs. Comme behavior-watch, la série
 * peut se terminer aujourd'hui ou hier, et un jour sans donnée
 * l'interrompt (on ne suppose jamais qu'un jour vide était entraîné).
 */
export function consecutiveTrainingDays(state: GamificationState, today: string): number {
  let cursor = trainedOn(state, today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (trainedOn(state, cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

/** Jours consécutifs avec au moins une action validée, aujourd'hui inclus. */
export function consecutiveTrackedDays(state: GamificationState, today: string): number {
  let cursor = today;
  let streak = 0;
  while (state.days[cursor]?.active) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

/** Jours écoulés depuis la dernière séance terminée, null si aucune. */
export function daysSinceLastWorkout(state: GamificationState, today: string): number | null {
  const dates = Object.keys(state.days)
    .filter((date) => date <= today && trainedOn(state, date))
    .sort();
  const last = dates[dates.length - 1];
  if (!last) return null;
  return Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86_400_000,
  );
}
