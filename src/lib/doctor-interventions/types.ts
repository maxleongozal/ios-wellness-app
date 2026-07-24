import type { ScreenId, UserConfig } from "@/types";
import type { DoctorSituationId, DoctorTone } from "@/content/doctor-messages";

/* ------------------------------------------------------------------ */
/* Types du moteur d'interventions contextuelles du Dr Sane.          */
/* ------------------------------------------------------------------ */

/** Journal du jour, vu du moteur d'interventions. */
export interface InterventionDayContext {
  mealsLogged: number;
  caloriesConsumed: number;
  fiberG: number;
  waterMl: number;
  /** La séance planifiée du jour est terminée (tous les exercices cochés). */
  workoutDone: boolean;
}

/**
 * Contexte courant évalué par le moteur. Entièrement fourni par
 * l'appelant — le moteur ne lit ni l'horloge ni le stockage
 * (même convention que gamification/engine et safety/behavior-watch).
 * Les champs `null` signifient « donnée non disponible » : les
 * situations concernées restent simplement silencieuses.
 */
export interface InterventionContext {
  /** Date locale "YYYY-MM-DD". */
  today: string;
  /** Heure locale, 0-23. */
  hour: number;
  config: UserConfig;
  /** Cibles du jour, issues du moteur métabolique. */
  targets: { calories: number; waterMl: number; proteinG: number };
  /** Titre de la séance planifiée du jour (pour le briefing du matin). */
  workoutTitle: string;
  day: InterventionDayContext;
  /** Régularité de la semaine en cours (module gamification). */
  week: { activeDays: number; targetDays: number };
  /** Jours d'entraînement consécutifs se terminant aujourd'hui ou hier. */
  consecutiveTrainingDays: number;
  /** Jours consécutifs avec au moins une donnée renseignée. */
  consecutiveTrackedDays: number;
  /** Jours écoulés depuis la dernière séance terminée, null si aucune. */
  daysSinceLastWorkout: number | null;
  weight: { startKg: number; currentKg: number; goalKg: number };
  /** kcal renseignées hier, null si non journalisées. */
  yesterdayCalories: number | null;
  /** Date de la dernière pesée "YYYY-MM-DD", null si inconnue. */
  lastWeighInDate: string | null;
}

/** Résultat d'une détection : variables du message + palier éventuel. */
export interface SituationMatch {
  vars: Record<string, string | number>;
  /** Identifiant de palier (ex. "50") — célébré une seule fois, à vie. */
  milestone?: string;
}

export interface SituationRule {
  id: DoctorSituationId;
  detect: (ctx: InterventionContext) => SituationMatch | null;
}

/** Intervention prête à afficher : message interpolé + action éventuelle. */
export interface DoctorIntervention {
  id: DoctorSituationId;
  tone: DoctorTone;
  message: string;
  cta: { label: string; screen: ScreenId } | null;
  /** Palier associé, à mémoriser pour ne jamais le re-célébrer. */
  milestone?: string;
}

/** Historique persisté servant aux plafonds de fréquence. */
export interface InterventionHistory {
  version: 1;
  /** Interventions affichées ({ id, date }), élaguées au-delà de 14 jours. */
  shown: { id: string; date: string }[];
  /** Paliers déjà célébrés ("situationId:palier"), jamais re-célébrés. */
  celebratedMilestones: string[];
}
