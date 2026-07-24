import type {
  Exercise,
  ModuleId,
  Objectif,
  OnboardingAnswers,
  UserConfig,
  UserProfile,
} from "@/types";
import { computeMetabolics } from "@/lib/metabolic-engine";
import { validateGoal } from "@/lib/safety";

/* ------------------------------------------------------------------ */
/* Moteur de personnalisation : les réponses du questionnaire         */
/* produisent un UserConfig, et le Dashboard se dessine en le lisant. */
/* ------------------------------------------------------------------ */

const ACCENT_BY_OBJECTIF: Record<Objectif, string> = {
  perte_poids: "#e58a2b",
  prise_masse: "#1f5b47",
  endurance: "#2d7fa8",
  bien_etre: "#8a7ab8",
};

export function buildUserConfig(answers: OnboardingAnswers): UserConfig {
  const objectif = answers.objectif ?? "bien_etre";
  const acceptedSupplements = answers.acceptedSupplements ?? [];
  // La position globale est dérivée de la sélection au cas par cas :
  // au moins un complément accepté → 'open', aucun → 'against'.
  const stance = acceptedSupplements.length > 0 ? "open" : "against";

  const visibleModules: ModuleId[] = [
    "dashboard",
    "sport",
    "nutrition",
    "hydratation",
    "bien_etre",
  ];
  // Le module "Suivi des compléments" n'existe que s'il y a quelque chose à suivre.
  if (acceptedSupplements.length > 0) visibleModules.push("suivi_supplements");

  // Défense en profondeur : même si le flow laissait passer un objectif
  // dangereux, la config finale est ramenée dans les limites de sécurité
  // (rythme, plancher IMC, maintien avant 18 ans) — voir safety/goal-guard.
  const weightKg = clamp(answers.weightKg, WEIGHT_MIN, WEIGHT_MAX);
  const requestedGoalKg = clamp(answers.weightGoalKg ?? answers.weightKg, WEIGHT_MIN, WEIGHT_MAX);
  const age = clamp(answers.age, AGE_MIN, AGE_MAX);
  const heightCm = clamp(answers.heightCm, HEIGHT_MIN, HEIGHT_MAX);
  const assessment = validateGoal({
    biologie: answers.biologie ?? "homme",
    age,
    heightCm,
    weightKg,
    weightGoalKg: requestedGoalKg,
    targetWeeks: answers.targetWeeks ?? 0,
  });
  const weightGoalKg = assessment.safeGoalKg;
  const targetWeeks =
    answers.targetWeeks !== null && assessment.ok
      ? answers.targetWeeks
      : assessment.recommendedWeeks;

  return {
    userName: answers.userName.trim() || "Athlète",
    biologie: answers.biologie ?? "homme",
    objectif,
    stanceSupplements: stance,
    acceptedSupplements,
    dietType: "standard",
    age,
    heightCm,
    weightKg,
    weightGoalKg,
    targetWeeks,
    activityLevel: answers.activityLevel ?? "leger",
    sleep: answers.sleep ?? "6_8h",
    restrictiveDietHistory: answers.restrictiveDietHistory ?? false,
    uiTheme: {
      accentColor: ACCENT_BY_OBJECTIF[objectif],
      visibleModules,
    },
  };
}

/* --------------- Bornes physiologiques & validation --------------- */

export const AGE_MIN = 13;
export const AGE_MAX = 90;
export const HEIGHT_MIN = 130;
export const HEIGHT_MAX = 220;
export const WEIGHT_MIN = 35;
export const WEIGHT_MAX = 200;
// Au-delà de ±40 % du poids actuel, l'objectif est refusé comme irréaliste.
export const GOAL_MAX_DELTA_RATIO = 0.4;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(v * 10) / 10));
}

export function isGoalWeightRealistic(currentKg: number, goalKg: number): boolean {
  if (goalKg < WEIGHT_MIN || goalKg > WEIGHT_MAX) return false;
  return Math.abs(goalKg - currentKg) / currentKg <= GOAL_MAX_DELTA_RATIO;
}

export function supplementsAllowed(config: UserConfig | null): boolean {
  return config ? config.stanceSupplements !== "against" : true;
}

/* ---------------- Programme sport selon l'objectif ---------------- */

export interface WorkoutPlan {
  title: string;
  focus: string;
  durationMin: number;
  exercises: Exercise[];
}

const PLANS: Record<Objectif, WorkoutPlan> = {
  prise_masse: {
    title: "Renforcement Musculaire",
    focus: "Haut du corps",
    durationMin: 45,
    exercises: [
      { id: "e1", name: "Développé couché haltères", sets: 4, reps: "8-10", muscle: "Pectoraux", done: false },
      { id: "e2", name: "Tirage vertical", sets: 4, reps: "10-12", muscle: "Dos", done: false },
      { id: "e3", name: "Développé militaire", sets: 3, reps: "8-10", muscle: "Épaules", done: false },
      { id: "e4", name: "Rowing barre", sets: 3, reps: "10", muscle: "Dos", done: false },
      { id: "e5", name: "Curl biceps", sets: 3, reps: "12", muscle: "Biceps", done: false },
    ],
  },
  perte_poids: {
    title: "HIIT Brûle-Graisses",
    focus: "Full body",
    durationMin: 35,
    exercises: [
      { id: "e1", name: "Burpees", sets: 4, reps: "12", muscle: "Full body", done: false },
      { id: "e2", name: "Mountain climbers", sets: 4, reps: "30 s", muscle: "Core", done: false },
      { id: "e3", name: "Squats sautés", sets: 3, reps: "15", muscle: "Jambes", done: false },
      { id: "e4", name: "Corde à sauter", sets: 3, reps: "60 s", muscle: "Cardio", done: false },
      { id: "e5", name: "Gainage", sets: 3, reps: "45 s", muscle: "Core", done: false },
    ],
  },
  endurance: {
    title: "Course Fractionnée",
    focus: "Cardio",
    durationMin: 40,
    exercises: [
      { id: "e1", name: "Échauffement course lente", sets: 1, reps: "10 min", muscle: "Cardio", done: false },
      { id: "e2", name: "Fractionné 30/30", sets: 8, reps: "30 s", muscle: "Cardio", done: false },
      { id: "e3", name: "Récupération active", sets: 1, reps: "5 min", muscle: "Cardio", done: false },
      { id: "e4", name: "Fentes marchées", sets: 3, reps: "12", muscle: "Jambes", done: false },
      { id: "e5", name: "Étirements", sets: 1, reps: "8 min", muscle: "Mobilité", done: false },
    ],
  },
  bien_etre: {
    title: "Yoga & Méditation",
    focus: "Mobilité & souffle",
    durationMin: 30,
    exercises: [
      { id: "e1", name: "Salutation au soleil", sets: 3, reps: "5 cycles", muscle: "Full body", done: false },
      { id: "e2", name: "Posture du guerrier", sets: 2, reps: "60 s", muscle: "Jambes", done: false },
      { id: "e3", name: "Posture de l'enfant", sets: 2, reps: "90 s", muscle: "Dos", done: false },
      { id: "e4", name: "Respiration profonde", sets: 1, reps: "5 min", muscle: "Souffle", done: false },
      { id: "e5", name: "Méditation guidée", sets: 1, reps: "10 min", muscle: "Mental", done: false },
    ],
  },
};

export function getWorkoutPlan(objectif: Objectif): WorkoutPlan {
  return PLANS[objectif];
}

/* -------- Profil dérivé : la UI lit ce profil, pas la data brute -------- */

export function deriveProfile(base: UserProfile, config: UserConfig): UserProfile {
  const plan = getWorkoutPlan(config.objectif);
  // Plus aucun chiffre arbitraire : calories, macros et hydratation
  // sortent du moteur métabolique (Mifflin-St Jeor + garde-fous).
  const metabolics = computeMetabolics(config);

  return {
    ...base,
    name: config.userName,
    age: config.age,
    height: config.heightCm,
    weightCurrent: config.weightKg,
    weightStart: config.weightKg,
    weightGoal: config.weightGoalKg,
    targetCalories: metabolics.targetCalories,
    targetMacros: metabolics.macros,
    targetWaterMl: metabolics.waterMl,
    workoutTitle: plan.title,
    workoutFocus: plan.focus,
    workoutDurationMin: plan.durationMin,
  };
}

/* ----------------------- Persistance locale ----------------------- */

const STORAGE_KEY = "sanefit.userConfig";

export function saveUserConfig(config: UserConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* stockage indisponible : le prototype reste utilisable en mémoire */
  }
}

export function loadUserConfig(): UserConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserConfig;
    if (!parsed || typeof parsed.userName !== "string" || !parsed.uiTheme) return null;
    // Config d'une version antérieure (sans physio ou sans sélection
    // de compléments au cas par cas) → re-onboarding.
    if (
      typeof parsed.age !== "number" ||
      typeof parsed.heightCm !== "number" ||
      typeof parsed.weightKg !== "number" ||
      typeof parsed.weightGoalKg !== "number" ||
      typeof parsed.targetWeeks !== "number" ||
      !Array.isArray(parsed.acceptedSupplements)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearUserConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
