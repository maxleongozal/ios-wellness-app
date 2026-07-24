import { createInitialState } from "./engine";
import type { GamificationState } from "./types";

/* ------------------------------------------------------------------ */
/* Persistance locale de la progression, sur le modèle de             */
/* user-config.ts : localStorage, clé versionnée, dégradation douce   */
/* si le stockage est indisponible.                                   */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "sanefit.gamification";

export function saveGamificationState(state: GamificationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* stockage indisponible : le prototype reste utilisable en mémoire */
  }
}

/** Charge l'état persisté, ou un état neuf si absent/incompatible. */
export function loadGamificationState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GamificationState;
    if (
      !parsed ||
      parsed.version !== 1 ||
      typeof parsed.xpTotal !== "number" ||
      typeof parsed.days !== "object" ||
      typeof parsed.weeks !== "object" ||
      typeof parsed.counters !== "object"
    ) {
      return createInitialState();
    }
    return parsed;
  } catch {
    return createInitialState();
  }
}

/** Réinitialisation complète — outil de développement uniquement. */
export function resetGamification() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
