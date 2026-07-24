import type { ActivityLevel, Biologie, Macros, Objectif, UserConfig } from "@/types";

/* ------------------------------------------------------------------ */
/* Moteur de calcul physiologique — Mifflin-St Jeor + garde-fous.     */
/* Aucun chiffre arbitraire : tout découle des données d'onboarding.  */
/* ------------------------------------------------------------------ */

export interface MetabolicProfile {
  /** Métabolisme de base (kcal/j), formule de Mifflin-St Jeor. */
  mb: number;
  activityFactor: number;
  /** Dépense énergétique totale : MB × facteur d'activité. */
  tdee: number;
  /** Ajustement appliqué au TDEE selon l'objectif (ex: -0.20 = déficit 20 %). */
  adjustmentPct: number;
  /** Cible calorique finale, après application des planchers de sécurité. */
  targetCalories: number;
  /** Plancher de sécurité effectif : max(MB, 1200 femme / 1500 homme). */
  calorieFloor: number;
  /** true si la cible a été relevée jusqu'au plancher. */
  floorApplied: boolean;
  proteinPerKg: number;
  fatPerKg: number;
  /** Grammes par jour ; les glucides complètent les calories restantes. */
  macros: Macros;
  /** Hydratation cible : 35 ml/kg, arrondie aux 100 ml. */
  waterMl: number;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  tres_actif: 1.725,
};

const ABSOLUTE_FLOOR_KCAL: Record<Biologie, number> = {
  homme: 1500,
  femme: 1200,
};

// 1.6 à 2.2 g/kg selon l'objectif (préservation musculaire maximale en déficit).
const PROTEIN_PER_KG: Record<Objectif, number> = {
  perte_poids: 2.2,
  prise_masse: 2.0,
  endurance: 1.8,
  bien_etre: 1.6,
};

// Minimum 0.8 à 1 g/kg — indispensable pour la santé hormonale.
const FAT_PER_KG: Record<Objectif, number> = {
  perte_poids: 1.0,
  prise_masse: 0.9,
  endurance: 0.8,
  bien_etre: 1.0,
};

type MetabolicInput = Pick<
  UserConfig,
  "biologie" | "age" | "heightCm" | "weightKg" | "objectif" | "activityLevel" | "restrictiveDietHistory"
>;

export function computeMetabolics(c: MetabolicInput): MetabolicProfile {
  // Mifflin-St Jeor : (10 × poids) + (6.25 × taille) − (5 × âge) ± constante sexe.
  const mb = Math.round(
    10 * c.weightKg + 6.25 * c.heightCm - 5 * c.age + (c.biologie === "homme" ? 5 : -161),
  );

  const activityFactor = ACTIVITY_FACTORS[c.activityLevel];
  const tdee = Math.round(mb * activityFactor);

  // Déficit progressif sain de 15-20 % ; un historique de régimes restrictifs
  // impose la borne douce. Surplus maîtrisé de 10-15 % selon le volume d'entraînement.
  let adjustmentPct = 0;
  if (c.objectif === "perte_poids") {
    adjustmentPct = c.restrictiveDietHistory ? -0.15 : -0.2;
  } else if (c.objectif === "prise_masse") {
    adjustmentPct =
      c.activityLevel === "modere" || c.activityLevel === "tres_actif" ? 0.15 : 0.1;
  }

  const calorieFloor = Math.max(mb, ABSOLUTE_FLOOR_KCAL[c.biologie]);
  const rawTarget = Math.round(tdee * (1 + adjustmentPct));
  const targetCalories = Math.max(rawTarget, calorieFloor);
  const floorApplied = targetCalories > rawTarget;

  let proteinPerKg = PROTEIN_PER_KG[c.objectif];
  let fatPerKg = FAT_PER_KG[c.objectif];
  let protein = Math.round(proteinPerKg * c.weightKg);
  let fat = Math.round(fatPerKg * c.weightKg);

  // Si protéines + lipides dépassent déjà la cible (poids élevé + cible basse),
  // on redescend aux minima physiologiques avant de tronquer les glucides.
  if (protein * 4 + fat * 9 > targetCalories) {
    proteinPerKg = 1.6;
    fatPerKg = 0.8;
    protein = Math.round(proteinPerKg * c.weightKg);
    fat = Math.round(fatPerKg * c.weightKg);
  }

  const carbs = Math.max(0, Math.round((targetCalories - protein * 4 - fat * 9) / 4));

  const waterMl = Math.round((c.weightKg * 35) / 100) * 100;

  return {
    mb,
    activityFactor,
    tdee,
    adjustmentPct,
    targetCalories,
    calorieFloor,
    floorApplied,
    proteinPerKg,
    fatPerKg,
    macros: { protein, carbs, fat },
    waterMl,
  };
}

export function describeAdjustment(m: MetabolicProfile): string {
  if (m.adjustmentPct < 0) {
    return `Déficit progressif de ${Math.round(Math.abs(m.adjustmentPct) * 100)} %`;
  }
  if (m.adjustmentPct > 0) {
    return `Surplus maîtrisé de +${Math.round(m.adjustmentPct * 100)} %`;
  }
  return "Maintenance (équilibre énergétique)";
}
