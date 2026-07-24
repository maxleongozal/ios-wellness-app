import type { UserConfig } from "@/types";
import { computeMetabolics, type MetabolicProfile } from "@/lib/metabolic-engine";
import {
  CREATINE_SAFE_MAX_G,
  type DailyIntake,
} from "@/lib/health-guardian";

/* ------------------------------------------------------------------ */
/* Alertes de SÉCURITÉ du Dr. Sane : les règles miroir du Gardien de  */
/* Santé partagent ses seuils — le médecin et les bannières ne se     */
/* contredisent jamais. Ces messages sont hors quota : contrairement  */
/* aux interventions contextuelles (lib/doctor-interventions), une    */
/* alerte de sécurité n'est jamais supprimée par un plafond de        */
/* fréquence.                                                         */
/* ------------------------------------------------------------------ */

export type DoctorSeverity = "info" | "warning" | "danger";

export interface DoctorAdvice {
  id: string;
  severity: DoctorSeverity;
  message: string;
}

/**
 * Renvoie l'alerte de sécurité du médecin sur le Dashboard, ou null si
 * la journée ne présente aucun risque. Une seule à la fois : la plus
 * grave prime. Le reste de la parole du Dr Sane passe par le moteur
 * d'interventions contextuelles.
 */
export function getDoctorSafetyAlert(
  config: UserConfig,
  dailyLog: DailyIntake,
): DoctorAdvice | null {
  const m = computeMetabolics(config);

  // Excès de créatine — uniquement si l'utilisateur suit ce complément.
  if (
    config.acceptedSupplements.includes("creatine") &&
    dailyLog.creatineTakenG > CREATINE_SAFE_MAX_G
  ) {
    return {
      id: "doc-creatine",
      severity: "danger",
      message: `Attention ! Tu as enregistré ${dailyLog.creatineTakenG} g de créatine aujourd'hui. Ton corps ne peut pas tout assimiler et cela fatigue tes reins inutilement. Reviens à 3-${CREATINE_SAFE_MAX_G} g max.`,
    };
  }

  // Sous-alimentation critique : apport du jour sous le métabolisme de base.
  if (dailyLog.caloriesConsumed > 0 && dailyLog.caloriesConsumed < m.mb) {
    return {
      id: "doc-sousalim",
      severity: "danger",
      message: `Alerte santé : tu n'as pas consommé assez de calories aujourd'hui (${dailyLog.caloriesConsumed} kcal pour un métabolisme de base de ${m.mb} kcal). S'affamer ralentit le métabolisme et détruit le muscle.`,
    };
  }

  return null;
}

/* --------------------- Pédagogie de l'onboarding ------------------- */

/** Explication du calcul calorique, sur l'écran récap de l'onboarding. */
export function getCalorieEducation(m: MetabolicProfile): DoctorAdvice {
  const base = `Bonjour ! J'ai vérifié tes données. Ton métabolisme de base est de ${m.mb} kcal. Nous ne descendrons jamais en dessous pour préserver tes hormones et ton énergie.`;
  return {
    id: "onb-calories",
    severity: "info",
    message: m.floorApplied
      ? `${base} J'ai d'ailleurs relevé ta cible au plancher de sécurité (${m.calorieFloor} kcal).`
      : base,
  };
}

/** Message rassurant de la fiche complément, personnalisé par produit. */
export function getSupplementEducation(supplementName: string): DoctorAdvice {
  return {
    id: "onb-supplements",
    severity: "info",
    message: `La Whey et la Créatine sont sûres aux doses recommandées, mais elles ne remplacent pas une vraie alimentation. ${supplementName} peut t'aider — c'est toujours toi qui décides.`,
  };
}

/** Mention légale affichée au premier lancement du médecin. */
export const DOCTOR_DISCLAIMER =
  "Dr. Sane est un assistant virtuel basé sur des recommandations nutritionnelles établies. Il ne remplace pas un avis ou un suivi médical personnalisé.";
