import type { UserConfig, Warning } from "@/types";
import type { MetabolicProfile } from "@/lib/metabolic-engine";
import { SAFETY_CONFIG } from "@/lib/safety/config";

/* ------------------------------------------------------------------ */
/* Gardien de Santé : warnings quotidiens bienveillants du Dashboard. */
/* La validation des objectifs (rythme, plancher IMC, mineurs) vit    */
/* désormais dans safety/goal-guard.ts. Tous les seuils viennent de   */
/* safety/config.ts — aucune valeur en dur ici.                       */
/* ------------------------------------------------------------------ */

/** Réexports : les seuils vivent dans safety/config.ts, source unique. */
export const FIBER_TARGET_G = SAFETY_CONFIG.dailyIntake.fiberTargetG;
export const CREATINE_SAFE_MAX_G = SAFETY_CONFIG.dailyIntake.creatineSafeMaxG;

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
  const { severeUndereatingRatio, lowHydrationRatio } = SAFETY_CONFIG.dailyIntake;

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

  if (
    intake.caloriesConsumed > 0 &&
    intake.caloriesConsumed < metabolics.mb * severeUndereatingRatio
  ) {
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

  if (intake.waterMl < intake.targetWaterMl * lowHydrationRatio) {
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
