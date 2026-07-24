import type { Exercise, Meal, UserProfile, Warning } from "@/types";

export const userProfile: UserProfile = {
  name: "Alex",
  age: 28,
  height: 178,
  weightCurrent: 76.4,
  weightGoal: 72,
  weightStart: 82,
  streak: 14,
  targetCalories: 2200,
  targetMacros: { protein: 150, carbs: 240, fat: 70 },
  targetWaterMl: 2500,
  workoutTitle: "Renforcement Musculaire",
  workoutFocus: "Haut du corps",
  workoutDurationMin: 45,
};

export const meals: Meal[] = [
  {
    id: "m1",
    name: "Flocons d'avoine, myrtilles & amandes",
    category: "petit-dejeuner",
    calories: 420,
    macros: { protein: 18, carbs: 58, fat: 12 },
    time: "07:45",
  },
  {
    id: "m2",
    name: "Bowl poulet, quinoa & légumes rôtis",
    category: "dejeuner",
    calories: 640,
    macros: { protein: 48, carbs: 62, fat: 18 },
    time: "12:30",
  },
  {
    id: "m3",
    name: "Yaourt grec & noix",
    category: "snacks",
    calories: 210,
    macros: { protein: 15, carbs: 12, fat: 11 },
    time: "16:15",
  },
];

export const exercises: Exercise[] = [
  { id: "e1", name: "Développé couché haltères", sets: 4, reps: "8-10", muscle: "Pectoraux", done: true },
  { id: "e2", name: "Tirage vertical", sets: 4, reps: "10-12", muscle: "Dos", done: true },
  { id: "e3", name: "Développé militaire", sets: 3, reps: "8-10", muscle: "Épaules", done: false },
  { id: "e4", name: "Rowing barre", sets: 3, reps: "10", muscle: "Dos", done: false },
  { id: "e5", name: "Curl biceps", sets: 3, reps: "12", muscle: "Biceps", done: false },
];

// Journal nutritionnel du jour (mock) — consommé par le Gardien de Santé
// pour générer les warnings quotidiens du Dashboard.
export const dailyTracking = {
  fiberG: 14,
  creatineTakenG: 12,
};

export const warnings: Warning[] = [
  {
    id: "w1",
    title: "Attention : habitudes malsaines détectées",
    message:
      "Votre consommation de créatine aujourd'hui (12g) dépasse largement la limite recommandée pour votre prise de poids.",
    detail: "Une surconsommation peut être nocive à long terme.",
    severity: "danger",
    cta: "Ajuster ma dose",
  },
  {
    id: "w2",
    title: "Hydratation insuffisante",
    message:
      "Vous n'avez bu que 1,2 L aujourd'hui. Visez au moins 2,5 L pour soutenir votre récupération.",
    severity: "warning",
    cta: "Ajouter un verre",
  },
];
