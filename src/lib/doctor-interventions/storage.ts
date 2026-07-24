import { createEmptyHistory } from "./engine";
import type { InterventionHistory } from "./types";

/* ------------------------------------------------------------------ */
/* Persistance de l'historique d'interventions, sur le modèle de      */
/* user-config.ts : localStorage, clé versionnée, dégradation douce.  */
/* Sans historique persisté, les plafonds de fréquence repartiraient  */
/* de zéro à chaque session.                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "sanefit.doctorInterventions";

export function saveInterventionHistory(history: InterventionHistory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* stockage indisponible : le prototype reste utilisable en mémoire */
  }
}

export function loadInterventionHistory(): InterventionHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyHistory();
    const parsed = JSON.parse(raw) as InterventionHistory;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.shown) ||
      !Array.isArray(parsed.celebratedMilestones)
    ) {
      return createEmptyHistory();
    }
    return parsed;
  } catch {
    return createEmptyHistory();
  }
}

export function resetInterventionHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
