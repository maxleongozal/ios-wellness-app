import { SAFETY_CONFIG } from "@/lib/safety";
import type { InterventionContext, SituationRule } from "./types";

/* ------------------------------------------------------------------ */
/* Situations détectables par le Dr Sane. Chaque règle lit le         */
/* contexte et renvoie les variables de son message, ou null.         */
/* Les TEXTES vivent dans content/doctor-messages.ts — ici,           */
/* uniquement les conditions.                                         */
/*                                                                    */
/* Les constantes ci-dessous sont des heuristiques d'ENGAGEMENT       */
/* (quand parler), pas des seuils de sécurité : ceux-ci restent dans  */
/* safety/config.ts et sont importés quand une situation en dépend.   */
/* ------------------------------------------------------------------ */

/** Fin de matinée : au-delà, le briefing du jour n'a plus de sens. */
const MORNING_END_HOUR = 11;
/** Après cette heure, une journée sans repas est un oubli probable. */
const MISSING_DATA_HOUR = 14;
/** Heure du rappel d'hydratation si la journée est en retard. */
const HYDRATION_CHECK_HOUR = 15;
/** Sous ce ratio de la cible d'eau à 15 h, on relance. */
const HYDRATION_LATE_RATIO = 0.4;
/** Heure à partir de laquelle le point fibres est actionnable (dîner). */
const EVENING_HOUR = 18;
/** Heure du bilan de fin de journée. */
const NIGHT_REVIEW_HOUR = 20;
/** Tolérance du bilan du soir autour de la cible calorique. */
const CALORIE_ON_TRACK_LOW = 0.9;
const CALORIE_ON_TRACK_HIGH = 1.05;
/** Au-delà de ce ratio de la cible, l'écart de la veille mérite un mot. */
const CALORIE_OVERSHOOT_RATIO = 1.1;
/** Jours sans séance avant la relance douce. */
const INACTIVITY_DAYS = 4;
/** Paliers de progression vers l'objectif de poids, en %. */
const WEIGHT_MILESTONES_PCT = [25, 50, 75, 100];
/** Caps de série de suivi célébrés. */
const TRACKING_STREAK_CAPS = [7, 14, 30, 60, 100];
/** Jours sans pesée avant le rappel hebdomadaire. */
const WEIGH_IN_INTERVAL_DAYS = 7;

const dayDiff = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * Ordre de déclaration = priorité à ton égal (le moteur trie d'abord
 * par ton : alerte douce > félicitation > information).
 */
export const SITUATIONS: SituationRule[] = [
  /* ---------------------- Alertes douces --------------------------- */

  {
    id: "ecart_calorique_veille",
    detect: (ctx) => {
      if (ctx.yesterdayCalories === null) return null;
      if (ctx.yesterdayCalories <= ctx.targets.calories * CALORIE_OVERSHOOT_RATIO) return null;
      const ecartKcal = Math.round(ctx.yesterdayCalories - ctx.targets.calories);
      return {
        vars: {
          ecartKcal,
          ecartSemainePct: Math.max(1, Math.round((ecartKcal / (ctx.targets.calories * 7)) * 100)),
        },
      };
    },
  },
  {
    id: "hydratation_en_retard",
    detect: (ctx) => {
      if (ctx.hour < HYDRATION_CHECK_HOUR || ctx.hour >= NIGHT_REVIEW_HOUR) return null;
      if (ctx.day.waterMl >= ctx.targets.waterMl * HYDRATION_LATE_RATIO) return null;
      return {
        vars: { heure: ctx.hour, litres: (ctx.day.waterMl / 1000).toFixed(1) },
      };
    },
  },
  {
    id: "fibres_basses_soir",
    detect: (ctx) => {
      const target = SAFETY_CONFIG.dailyIntake.fiberTargetG;
      if (ctx.hour < EVENING_HOUR || ctx.day.mealsLogged === 0) return null;
      if (ctx.day.fiberG >= target) return null;
      return { vars: { fibresManquantes: target - ctx.day.fiberG } };
    },
  },
  {
    id: "inactivite",
    detect: (ctx) => {
      if (ctx.daysSinceLastWorkout === null || ctx.daysSinceLastWorkout < INACTIVITY_DAYS) {
        return null;
      }
      return { vars: { jours: ctx.daysSinceLastWorkout } };
    },
  },
  {
    id: "sommeil_court",
    detect: (ctx) => {
      if (ctx.config.sleep !== "moins_6h") return null;
      if (ctx.config.objectif !== "prise_masse" && ctx.config.objectif !== "perte_poids") {
        return null;
      }
      return { vars: {} };
    },
  },

  /* ---------------------- Félicitations ---------------------------- */

  {
    id: "palier_poids",
    detect: (ctx) => {
      const { startKg, currentKg, goalKg } = ctx.weight;
      const total = Math.abs(goalKg - startKg);
      if (total < 0.1) return null;
      const done = startKg > goalKg ? startKg - currentKg : currentKg - startKg;
      const progressPct = (done / total) * 100;
      const milestone = [...WEIGHT_MILESTONES_PCT].reverse().find((m) => progressPct >= m);
      if (milestone === undefined) return null;
      return { vars: { progressionPct: milestone }, milestone: String(milestone) };
    },
  },
  {
    id: "semaine_reguliere",
    detect: (ctx) => {
      if (ctx.week.activeDays < ctx.week.targetDays) return null;
      return { vars: { joursActifs: ctx.week.activeDays } };
    },
  },
  {
    id: "cap_serie",
    detect: (ctx) => {
      if (!TRACKING_STREAK_CAPS.includes(ctx.consecutiveTrackedDays)) return null;
      return {
        vars: { jours: ctx.consecutiveTrackedDays },
        milestone: String(ctx.consecutiveTrackedDays),
      };
    },
  },
  {
    id: "seance_terminee",
    detect: (ctx) => (ctx.day.workoutDone ? { vars: {} } : null),
  },
  {
    id: "hydratation_atteinte",
    detect: (ctx) => (ctx.day.waterMl >= ctx.targets.waterMl ? { vars: {} } : null),
  },

  /* ----------------------- Informations ---------------------------- */

  {
    id: "briefing_matin",
    detect: (ctx) => {
      if (ctx.hour >= MORNING_END_HOUR) return null;
      if (ctx.day.mealsLogged > 0 || ctx.day.workoutDone) return null;
      return {
        vars: {
          prenom: ctx.config.userName,
          kcal: ctx.targets.calories,
          proteines: ctx.targets.proteinG,
          seance: ctx.workoutTitle,
        },
      };
    },
  },
  {
    id: "donnees_manquantes",
    detect: (ctx) => {
      if (ctx.hour < MISSING_DATA_HOUR || ctx.day.mealsLogged > 0) return null;
      return { vars: {} };
    },
  },
  {
    id: "repos_a_prevoir",
    // Coup de coude UN jour avant le seuil de sécurité (behavior-watch
    // intervient à `noRestConsecutiveDays`) : le médecin prévient en
    // douceur, le Gardien alerte — jamais le même jour au même seuil.
    detect: (ctx) => {
      const softThreshold = SAFETY_CONFIG.behavior.noRestConsecutiveDays - 1;
      if (ctx.consecutiveTrainingDays < softThreshold) return null;
      return { vars: { jours: ctx.consecutiveTrainingDays } };
    },
  },
  {
    id: "pesee_hebdo",
    detect: (ctx) => {
      if (ctx.lastWeighInDate === null) return null;
      if (dayDiff(ctx.lastWeighInDate, ctx.today) < WEIGH_IN_INTERVAL_DAYS) return null;
      return { vars: {} };
    },
  },
  {
    id: "bilan_soir",
    detect: (ctx) => {
      if (ctx.hour < NIGHT_REVIEW_HOUR || ctx.day.mealsLogged < 2) return null;
      const kcal = ctx.day.caloriesConsumed;
      const onTrack =
        kcal >= ctx.targets.calories * CALORIE_ON_TRACK_LOW &&
        kcal <= ctx.targets.calories * CALORIE_ON_TRACK_HIGH &&
        ctx.day.waterMl >= ctx.targets.waterMl * 0.8;
      return onTrack ? { vars: {} } : null;
    },
  },
];
