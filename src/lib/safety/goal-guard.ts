import type { Biologie } from "@/types";
import { SAFETY_CONFIG } from "./config";
import type { SafetyIntervention } from "./types";

/* ------------------------------------------------------------------ */
/* Garde-fou des objectifs : intercepte la définition d'un objectif   */
/* de poids (onboarding et modifications ultérieures), calcule le     */
/* rythme hebdomadaire implicite et le confronte aux seuils de        */
/* config.ts. Jamais de refus sec : chaque intervention explique le   */
/* mécanisme physiologique et propose une correction acceptable       */
/* d'un geste.                                                        */
/* Deux règles sont dures : le plancher IMC 18,5 et l'absence de      */
/* déficit avant 18 ans — l'app ne générera jamais de plan sous ces   */
/* limites, mais propose toujours une alternative.                    */
/* ------------------------------------------------------------------ */

export interface GoalInput {
  biologie: Biologie;
  age: number;
  heightCm: number;
  weightKg: number;
  weightGoalKg: number;
  targetWeeks: number;
}

export interface GoalAssessment {
  /** true si l'objectif respecte tous les seuils. */
  ok: boolean;
  /** Rythme hebdomadaire implicite, en kg (valeur absolue) et en % du poids. */
  rateKgPerWeek: number;
  ratePctPerWeek: number;
  /** Seuil applicable à CE profil, en kg/sem (perte ou prise selon l'objectif). */
  maxRateKgPerWeek: number;
  /** Échéance recalculée au rythme recommandé, prête à accepter d'un geste. */
  recommendedWeeks: number;
  /** Objectif de poids corrigé (plancher IMC, maintien pour un mineur), sinon inchangé. */
  safeGoalKg: number;
  /** Poids plancher correspondant à l'IMC minimal pour cette taille. */
  bmiFloorKg: number;
  intervention: SafetyIntervention | null;
}

const { pace, body } = SAFETY_CONFIG;

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Perte hebdomadaire maximale pour un poids donné : min(% du poids, plafond absolu). */
export function lossMaxKgPerWeekFor(weightKg: number): number {
  return Math.min(pace.lossMaxKgPerWeek, (pace.lossMaxPctPerWeek / 100) * weightKg);
}

/** Prise hebdomadaire maximale pour un poids donné. */
export function gainMaxKgPerWeekFor(weightKg: number): number {
  return (pace.gainMaxPctPerWeek / 100) * weightKg;
}

/** Poids plancher (IMC minimal OMS) pour une taille, arrondi au 0,5 kg supérieur. */
export function bmiFloorKgFor(heightCm: number): number {
  const meters = heightCm / 100;
  return Math.ceil(body.bmiFloor * meters * meters * 2) / 2;
}

function clampWeeks(weeks: number): number {
  return Math.min(pace.planWeeksMax, Math.max(pace.planWeeksMin, weeks));
}

/** Durée saine pour absorber `deltaKg` au rythme recommandé (perte ou prise). */
function recommendedWeeksFor(weightKg: number, deltaKg: number): number {
  const pct = deltaKg < 0 ? pace.lossRecommendedPctPerWeek : pace.gainRecommendedPctPerWeek;
  const ratePerWeek = (pct / 100) * weightKg;
  return clampWeeks(Math.ceil(Math.abs(deltaKg) / ratePerWeek));
}

export function validateGoal(input: GoalInput): GoalAssessment {
  const { age, heightCm, weightKg, weightGoalKg, targetWeeks } = input;
  const deltaKg = weightGoalKg - weightKg;
  const isLoss = deltaKg < 0;

  const rateKgPerWeek = targetWeeks > 0 ? round2(Math.abs(deltaKg) / targetWeeks) : 0;
  const ratePctPerWeek = weightKg > 0 ? round2((rateKgPerWeek / weightKg) * 100) : 0;
  const maxRateKgPerWeek = round2(
    isLoss ? lossMaxKgPerWeekFor(weightKg) : gainMaxKgPerWeekFor(weightKg),
  );
  const bmiFloorKg = bmiFloorKgFor(heightCm);
  const recommendedWeeks = recommendedWeeksFor(weightKg, deltaKg);

  const base = {
    rateKgPerWeek,
    ratePctPerWeek,
    maxRateKgPerWeek,
    recommendedWeeks,
    bmiFloorKg,
  };

  // Règle dure n°1 : pas de déficit avant l'âge adulte.
  if (isLoss && age < body.adultAge) {
    return {
      ...base,
      ok: false,
      safeGoalKg: weightKg,
      intervention: {
        id: "gg-mineur",
        kind: "mineur_deficit",
        severity: "warning",
        title: "Ton corps est encore en construction",
        message:
          `Avant ${body.adultAge} ans, ton corps est en pleine croissance : tes os, tes hormones et ton cerveau ont besoin d'énergie en continu, et les repères adultes de SaneFit ne s'appliquent pas à toi. Je ne programme donc pas de déficit calorique — on peut viser la forme, la force et de bonnes habitudes, c'est bien plus efficace à ton âge. Si ton poids t'inquiète, le bon interlocuteur est un médecin qui te connaît.`,
        proposalLabel: "Garder mon poids et viser la forme",
      },
    };
  }

  // Règle dure n°2 : aucun objectif sous le plancher IMC.
  if (isLoss && weightGoalKg < bmiFloorKg) {
    const safeDelta = bmiFloorKg - weightKg;
    return {
      ...base,
      ok: false,
      safeGoalKg: bmiFloorKg,
      recommendedWeeks: safeDelta < 0 ? recommendedWeeksFor(weightKg, safeDelta) : targetWeeks,
      intervention: {
        id: "gg-imc",
        kind: "plancher_imc",
        severity: "warning",
        title: "Ce poids passerait sous le seuil de sécurité",
        message:
          `Pour ta taille (${heightCm} cm), un poids de ${weightGoalKg.toLocaleString("fr-FR")} kg passerait sous un IMC de ${body.bmiFloor.toLocaleString("fr-FR")}, le seuil d'insuffisance pondérale de l'OMS. Sous ce repère, le corps manque de réserves pour ses fonctions de base : hormones, immunité, solidité des os. C'est pourquoi SaneFit ne programme jamais de perte en dessous de ${bmiFloorKg.toLocaleString("fr-FR")} kg — c'est l'objectif le plus bas que je peux t'accompagner à viser.`,
        proposalLabel: `Viser ${bmiFloorKg.toLocaleString("fr-FR")} kg, pas moins`,
      },
    };
  }

  // Rythme de perte trop rapide.
  if (isLoss && targetWeeks > 0 && rateKgPerWeek > maxRateKgPerWeek) {
    return {
      ...base,
      ok: false,
      safeGoalKg: weightGoalKg,
      intervention: {
        id: "gg-rythme-perte",
        kind: "rythme_perte",
        severity: "warning",
        title: "Ralentissons un peu",
        message:
          `Ton plan implique ${rateKgPerWeek.toLocaleString("fr-FR")} kg par semaine, soit ${ratePctPerWeek.toLocaleString("fr-FR")} % de ton poids — au-delà de ${maxRateKgPerWeek.toLocaleString("fr-FR")} kg/sem, ton corps ne peut pas puiser autant d'énergie dans ses réserves de graisse : il complète en dégradant du muscle et ralentit son métabolisme pour se protéger. En visant ${recommendedWeeks} semaines, la perte vient majoritairement du gras et se maintient dans le temps. Même objectif, échéance ajustée.`,
        proposalLabel: `Ajuster à ${recommendedWeeks} semaines`,
      },
    };
  }

  // Rythme de prise trop rapide.
  if (!isLoss && deltaKg > 0 && targetWeeks > 0 && rateKgPerWeek > maxRateKgPerWeek) {
    return {
      ...base,
      ok: false,
      safeGoalKg: weightGoalKg,
      intervention: {
        id: "gg-rythme-prise",
        kind: "rythme_prise",
        severity: "warning",
        title: "Le muscle a sa vitesse de construction",
        message:
          `Ton plan implique +${rateKgPerWeek.toLocaleString("fr-FR")} kg par semaine. Au-delà d'environ ${pace.gainMaxPctPerWeek.toLocaleString("fr-FR")} % du poids par semaine, le surplus dépasse la vitesse à laquelle le muscle peut se construire : l'excédent est stocké en graisse, pas en muscle. En visant ${recommendedWeeks} semaines, chaque kilo pris a bien plus de chances d'être du muscle.`,
        proposalLabel: `Ajuster à ${recommendedWeeks} semaines`,
      },
    };
  }

  return { ...base, ok: true, safeGoalKg: weightGoalKg, intervention: null };
}
