import type { Biologie } from "@/types";

/* ================================================================== */
/* CONFIGURATION DES GARDE-FOUS DE SANTÉ — SOURCE UNIQUE DE VÉRITÉ    */
/*                                                                    */
/* TOUS les seuils de sécurité de SaneFit vivent ici, et uniquement   */
/* ici. Aucune valeur ne doit être codée en dur ailleurs : les        */
/* moteurs (metabolic-engine, health-guardian, goal-guard,            */
/* behavior-watch) importent ce fichier.                              */
/*                                                                    */
/* Chaque valeur est annotée avec sa source. Deux catégories :        */
/*   [SOURCÉ]      appuyé sur une recommandation publiée.             */
/*   [HEURISTIQUE] choix produit assumé, sans source directe — la     */
/*                 littérature donne la direction, pas le chiffre.    */
/* Ne transformez jamais une heuristique en fait : si vous ajoutez    */
/* un seuil sans source, marquez-le [HEURISTIQUE].                    */
/* ================================================================== */

export const SAFETY_CONFIG = {
  /* ------------------- Rythme de variation du poids ---------------- */
  pace: {
    /** [SOURCÉ] Perte max avant intervention : 1 % du poids/semaine.
     *  CDC : 1-2 lb/sem (≈ 0,45-0,9 kg) ; ISSN (Aragon et al. 2017) :
     *  0,5-1 %/sem pour préserver la masse maigre. */
    lossMaxPctPerWeek: 1.0,
    /** [SOURCÉ] Plafond absolu quel que soit le gabarit : 1 kg/sem
     *  (borne haute CDC). Le seuil effectif = min(des deux). */
    lossMaxKgPerWeek: 1.0,
    /** [SOURCÉ, point exact = choix produit] Rythme utilisé pour
     *  l'échéance recalculée : milieu de la zone prudente ISSN (0,5-0,75 %). */
    lossRecommendedPctPerWeek: 0.6,
    /** [SOURCÉ] Prise max avant intervention : 0,5 % du poids/sem
     *  (Iraki et al. 2019 : 0,25-0,5 %/sem, moins pour les avancés). */
    gainMaxPctPerWeek: 0.5,
    /** [SOURCÉ, point exact = choix produit] Milieu de la fourchette Iraki. */
    gainRecommendedPctPerWeek: 0.35,
    /** [HEURISTIQUE] Bornes de durée d'un plan, en semaines. */
    planWeeksMin: 2,
    planWeeksMax: 52,
  },

  /* ----------------------- Plancher calorique ---------------------- */
  calories: {
    /** [SOURCÉ, convention] Plancher absolu sans suivi médical.
     *  Le panel NIH/NHLBI situe les régimes hypocaloriques ENCADRÉS à
     *  1000-1200 kcal (femmes) / 1200-1600 (hommes) et réserve < 800 kcal
     *  à une supervision médicale stricte. 1200/1500 est le repère
     *  conventionnel prudent au-dessus de ces fourchettes basses —
     *  ce n'est pas un chiffre unique de la littérature. */
    absoluteFloorKcal: { homme: 1500, femme: 1200 } as Record<Biologie, number>,
    /** [HEURISTIQUE] Jamais de cible sous le métabolisme de base
     *  (Mifflin-St Jeor). Aucune source ne l'énonce littéralement ;
     *  garde-fou prudent cohérent avec l'esprit des recommandations. */
    floorAtBasalMetabolism: true,
    /** [SOURCÉ] Déficit max : 20 % du TDEE — cohérent avec le déficit
     *  CDC de 500-1000 kcal/j et les déficits modestes ISSN. */
    deficitMaxPct: 0.2,
    /** [HEURISTIQUE] Borne douce en cas d'antécédents de régimes restrictifs. */
    deficitRestrictiveHistoryPct: 0.15,
    /** [SOURCÉ] Surplus de prise de masse : 10-15 % (Iraki et al. :
     *  ~10-20 %, conservateur pour limiter le gras). */
    surplusModestPct: 0.1,
    surplusActivePct: 0.15,
  },

  /* -------------------------- Corps & âge -------------------------- */
  body: {
    /** [SOURCÉ] Aucun objectif de poids sous un IMC de 18,5 : seuil
     *  d'insuffisance pondérale de la classification OMS. Règle DURE :
     *  l'app ne génère jamais de déficit visant un poids inférieur. */
    bmiFloor: 18.5,
    /** [SOURCÉ, principe] Avant 18 ans, pas de déficit calorique : les
     *  équations et seuils de ce fichier sont établis pour des adultes
     *  et ne s'appliquent pas à un corps en croissance. */
    adultAge: 18,
  },

  /* ------------- Seuils des alertes quotidiennes ------------------- */
  dailyIntake: {
    /** [SOURCÉ] Cible de fibres ~25-30 g/j (ANSES / EFSA). */
    fiberTargetG: 25,
    /** [SOURCÉ] Créatine : 3-5 g/j en entretien (position ISSN) ;
     *  au-delà, aucun bénéfice supplémentaire. */
    creatineSafeMaxG: 5,
    /** [HEURISTIQUE] Sous ce ratio du métabolisme de base en fin de
     *  journée, alerte de sous-alimentation sévère. */
    severeUndereatingRatio: 0.6,
    /** [HEURISTIQUE] Sous ce ratio de la cible d'eau, alerte hydratation. */
    lowHydrationRatio: 0.5,
  },

  /* -------------- Signaux d'alerte comportementaux ----------------- */
  /* Les trois fenêtres numériques ci-dessous sont des HEURISTIQUES    */
  /* produit : la littérature établit la direction (la récupération    */
  /* est nécessaire — ACSM : ≥ 48 h par groupe musculaire), jamais la  */
  /* fenêtre exacte. Elles déclenchent une intervention explicative    */
  /* du Dr Sane — jamais un blocage.                                   */
  behavior: {
    /** [HEURISTIQUE] Jours d'entraînement consécutifs sans repos avant alerte. */
    noRestConsecutiveDays: 7,
    /** [HEURISTIQUE] Chute des apports : moyenne des `recentDays` derniers
     *  jours comparée à celle des `baselineDays` précédents. */
    intakeDropRecentDays: 3,
    intakeDropBaselineDays: 7,
    /** Alerte si moyenne récente < 70 % de la moyenne de référence. */
    intakeDropRatio: 0.7,
    /** Jours renseignés minimum (référence / récent) pour éviter les faux positifs. */
    intakeDropMinBaselineDays: 4,
    intakeDropMinRecentDays: 2,
    /** [HEURISTIQUE] Objectif resserré ≥ 2 fois en 14 jours → intervention. */
    goalTighteningCount: 2,
    goalTighteningWindowDays: 14,
  },
} as const;

/* ------------------- Provenance affichée à l'utilisateur ---------- */
/* Alimente l'écran « Mes limites de sécurité » : chaque seuil doit    */
/* pouvoir dire d'où il vient.                                         */

export interface SafetySource {
  id: string;
  label: string;
  detail: string;
}

export const SAFETY_SOURCES: SafetySource[] = [
  {
    id: "cdc",
    label: "CDC — Steps for Losing Weight",
    detail: "Perte graduelle de 1 à 2 lb (0,45-0,9 kg) par semaine, via un déficit de 500 à 1000 kcal/j.",
  },
  {
    id: "issn",
    label: "ISSN — Diets and Body Composition (2017)",
    detail: "Perte de 0,5 à 1 % du poids par semaine pour préserver la masse musculaire ; plus lent = plus de muscle conservé.",
  },
  {
    id: "iraki",
    label: "Iraki et al. (2019) — Nutrition en prise de masse",
    detail: "Prise de 0,25 à 0,5 % du poids par semaine avec un surplus de 10-20 % ; au-delà, l'excédent est stocké en graisse.",
  },
  {
    id: "nih",
    label: "NIH / NHLBI — Régimes hypocaloriques",
    detail: "Tout régime sous 800 kcal/j exige une supervision médicale stricte ; les régimes bas encadrés vont de 1000 à 1600 kcal/j.",
  },
  {
    id: "oms",
    label: "OMS — Classification de l'IMC",
    detail: "Sous un IMC de 18,5, le corps est en insuffisance pondérale : réserves insuffisantes pour les fonctions de base.",
  },
  {
    id: "acsm",
    label: "ACSM — Recommandations d'entraînement",
    detail: "Au moins 48 h de récupération par groupe musculaire : c'est pendant le repos que le muscle se construit.",
  },
  {
    id: "heuristiques",
    label: "Repères SaneFit (heuristiques)",
    detail: "Les fenêtres de veille comportementale (7 jours sans repos, chute d'apports de 30 %, objectifs resserrés en 14 jours) sont des choix prudents de SaneFit, sans chiffre officiel dans la littérature.",
  },
];

/* ----------------------- Mention médicale -------------------------- */

export const MEDICAL_DISCLAIMER =
  "SaneFit ne remplace pas un avis médical. Les seuils appliqués ici sont des repères généraux issus de recommandations de santé publique : ils ne tiennent pas compte des situations particulières (grossesse, pathologies, traitements, troubles du comportement alimentaire…). En cas de doute, parles-en à un professionnel de santé qui te connaît.";
