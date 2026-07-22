import type {
  Exercise,
  ModuleId,
  Objectif,
  OnboardingAnswers,
  UserConfig,
  UserProfile,
} from "@/types";

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
  const stance = answers.stanceSupplements ?? "hesitant";

  const visibleModules: ModuleId[] = [
    "dashboard",
    "sport",
    "nutrition",
    "hydratation",
    "bien_etre",
  ];
  // stance 'open' → module dédié "Suivi des compléments" sur le Dashboard.
  // stance 'against' → aucun module ni conseil compléments, nulle part.
  if (stance === "open") visibleModules.push("suivi_supplements");

  return {
    userName: answers.userName.trim() || "Athlète",
    biologie: answers.biologie ?? "homme",
    objectif,
    stanceSupplements: stance,
    dietType: "standard",
    uiTheme: {
      accentColor: ACCENT_BY_OBJECTIF[objectif],
      visibleModules,
    },
  };
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

  let targetCalories = base.targetCalories;
  let targetMacros = base.targetMacros;
  // Ratio standard féminin pour une perte de poids.
  if (config.biologie === "femme" && config.objectif === "perte_poids") {
    targetCalories = 1800;
    targetMacros = { protein: 115, carbs: 160, fat: 62 };
  }

  return {
    ...base,
    name: config.userName,
    targetCalories,
    targetMacros,
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
