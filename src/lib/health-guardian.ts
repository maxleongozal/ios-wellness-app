import type { UserConfig, Warning } from "@/types";
import type { MetabolicProfile } from "@/lib/metabolic-engine";

/* ------------------------------------------------------------------ */
/* Gardien de Santé : détection des objectifs dangereux à             */
/* l'onboarding + warnings quotidiens bienveillants sur le Dashboard. */
/* ------------------------------------------------------------------ */

/** Au-delà de 1 kg perdu par semaine, l'objectif est jugé dangereux. */
export const MAX_LOSS_KG_PER_WEEK = 1;
/** Rythme cible utilisé pour proposer une durée réaliste. */
export const HEALTHY_LOSS_KG_PER_WEEK = 0.75;

export const PLAN_WEEKS_MIN = 2;
export const PLAN_WEEKS_MAX = 52;

export interface GoalPace {
  /** kg de variation par semaine (valeur absolue). */
  ratePerWeek: number;
  /** true si perte de poids > 1 kg/semaine. */
  dangerous: boolean;
  /** Durée saine proposée pour le même objectif de poids. */
  recommendedWeeks: number;
}

export function assessGoalPace(weightKg: number, goalKg: number, weeks: number): GoalPace {
  const deltaKg = goalKg - weightKg;
  const ratePerWeek = weeks > 0 ? Math.abs(deltaKg) / weeks : 0;
  const isLoss = deltaKg < 0;
  const recommendedWeeks = Math.min(
    PLAN_WEEKS_MAX,
    Math.max(PLAN_WEEKS_MIN, Math.ceil(Math.abs(deltaKg) / HEALTHY_LOSS_KG_PER_WEEK)),
  );
  return {
    ratePerWeek: Math.round(ratePerWeek * 100) / 100,
    dangerous: isLoss && ratePerWeek > MAX_LOSS_KG_PER_WEEK,
    recommendedWeeks,
  };
}

/* --------------------- Warnings quotidiens ------------------------ */

export interface DailyIntake {
  /** kcal consommées jusqu'ici aujourd'hui. */
  caloriesConsumed: number;
  /** grammes de fibres consommées. */
  fiberG: number;
  /** grammes de créatine pris aujourd'hui. */
  creatineTakenG: number;
  /** hydratation du jour en ml. */
  waterMl: number;
  /** ml d'eau visés (issus du moteur métabolique). */
  targetWaterMl: number;
}

export const FIBER_TARGET_G = 25;
export const CREATINE_SAFE_MAX_G = 5;
/** Sous ce ratio du métabolisme de base en fin de journée, on alerte. */
const SEVERE_UNDEREATING_RATIO = 0.6;

/**
 * Évalue la journée et produit les alertes bienveillantes du Dashboard.
 * Chaque règle respecte la config : on ne parle jamais d'un complément
 * que l'utilisateur n'a pas accepté.
 */
export function evaluateDailyWarnings(
  config: UserConfig,
  metabolics: MetabolicProfile,
  intake: DailyIntake,
): Warning[] {
  const warnings: Warning[] = [];

  if (
    config.acceptedSupplements.includes("creatine") &&
    intake.creatineTakenG > CREATINE_SAFE_MAX_G
  ) {
    warnings.push({
      id: "g-creatine",
      severity: "danger",
      title: "Attention : habitudes malsaines détectées",
      message: `Ta consommation de créatine aujourd'hui (${intake.creatineTakenG} g) dépasse largement la dose sûre de ${CREATINE_SAFE_MAX_G} g par jour.`,
      detail: "Au-delà, aucun bénéfice supplémentaire — une surconsommation peut être nocive à long terme.",
      cta: "Ajuster ma dose",
    });
  }

  if (intake.caloriesConsumed > 0 && intake.caloriesConsumed < metabolics.mb * SEVERE_UNDEREATING_RATIO) {
    warnings.push({
      id: "g-sousalim",
      severity: "danger",
      title: "Sous-alimentation sévère détectée",
      message: `Tu n'as consommé que ${intake.caloriesConsumed} kcal, bien en dessous de ton métabolisme de base (${metabolics.mb} kcal).`,
      detail: "Manger trop peu ralentit ton métabolisme et fait fondre tes muscles, pas ta graisse.",
      cta: "Voir mes repas",
    });
  }

  if (intake.fiberG < FIBER_TARGET_G) {
    warnings.push({
      id: "g-fibres",
      severity: "warning",
      title: "Manque de fibres aujourd'hui",
      message: `${intake.fiberG} g de fibres sur les ${FIBER_TARGET_G} g recommandés. Les calories ne font pas tout : légumes, fruits et légumineuses nourrissent ton microbiote.`,
      cta: "Idées de repas riches en fibres",
    });
  }

  if (intake.waterMl < intake.targetWaterMl * 0.5) {
    warnings.push({
      id: "g-hydratation",
      severity: "warning",
      title: "Hydratation insuffisante",
      message: `Tu n'as bu que ${(intake.waterMl / 1000).toFixed(1)} L aujourd'hui. Vise ${(intake.targetWaterMl / 1000).toFixed(1)} L pour soutenir ta récupération.`,
      cta: "Ajouter un verre",
    });
  }

  return warnings;
}
