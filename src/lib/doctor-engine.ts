import type { Objectif, UserConfig } from "@/types";
import { computeMetabolics, type MetabolicProfile } from "@/lib/metabolic-engine";
import {
  CREATINE_SAFE_MAX_G,
  FIBER_TARGET_G,
  type DailyIntake,
} from "@/lib/health-guardian";

/* ------------------------------------------------------------------ */
/* Moteur de dialogue du Dr. Sane : choisit le message le plus        */
/* pertinent à partir du UserConfig et du journal du jour.            */
/* Les règles miroir du Gardien de Santé partagent ses seuils —       */
/* le médecin et les bannières ne se contredisent jamais.             */
/* ------------------------------------------------------------------ */

export type DoctorSeverity = "info" | "warning" | "danger";

export interface DoctorAdvice {
  id: string;
  severity: DoctorSeverity;
  message: string;
}

/** Conseil du jour par défaut, adapté à l'objectif choisi à l'onboarding. */
const ADVICE_BY_OBJECTIF: Record<Objectif, string> = {
  perte_poids:
    "Ton déficit est calibré pour préserver ton muscle. Priorité du jour : des protéines à chaque repas et une bonne hydratation.",
  prise_masse:
    "Un léger surplus suffit pour construire du muscle. Mange régulièrement et soigne ton sommeil — c'est là que tu progresses vraiment.",
  endurance:
    "Pense à tes glucides autour de la séance et bois régulièrement : c'est le carburant de ton endurance.",
  bien_etre:
    "La régularité prime sur l'intensité. Bouge un peu chaque jour, hydrate-toi et écoute tes signaux de faim.",
};

/**
 * Renvoie le message exact et la sévérité de l'intervention du médecin
 * sur le Dashboard. Une seule intervention à la fois : la plus grave prime.
 */
export function getDoctorAdvice(config: UserConfig, dailyLog: DailyIntake): DoctorAdvice {
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

  // Manque de fibres / micronutriments.
  if (dailyLog.fiberG < FIBER_TARGET_G) {
    return {
      id: "doc-fibres",
      severity: "warning",
      message: `N'oublie pas tes micronutriments ! Tes macros sont bonnes, mais il te manque ${FIBER_TARGET_G - dailyLog.fiberG} g de fibres aujourd'hui. Légumes, fruits et légumineuses sont tes alliés.`,
    };
  }

  // Rien à signaler : conseil du jour selon l'objectif.
  return {
    id: "doc-conseil",
    severity: "info",
    message: ADVICE_BY_OBJECTIF[config.objectif],
  };
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
