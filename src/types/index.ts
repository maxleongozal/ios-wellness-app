export type ScreenId = "home" | "nutrition" | "workout" | "profile";

/* ---------- Onboarding / moteur de personnalisation ---------- */

export type Biologie = "homme" | "femme";
export type Objectif = "perte_poids" | "prise_masse" | "endurance" | "bien_etre";
export type StanceSupplements = "open" | "against" | "hesitant";
export type DietType = "standard" | "vegan" | "keto";

export type ModuleId =
  | "dashboard"
  | "sport"
  | "nutrition"
  | "hydratation"
  | "bien_etre"
  | "suivi_supplements";

export interface UiTheme {
  accentColor: string;
  visibleModules: ModuleId[];
}

export interface UserConfig {
  userName: string;
  biologie: Biologie;
  objectif: Objectif;
  stanceSupplements: StanceSupplements;
  dietType: DietType;
  uiTheme: UiTheme;
}

export interface OnboardingAnswers {
  userName: string;
  biologie: Biologie | null;
  objectif: Objectif | null;
  stanceSupplements: StanceSupplements | null;
}

export type MealCategory = "petit-dejeuner" | "dejeuner" | "diner" | "snacks";

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  calories: number;
  macros: Macros;
  time: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  muscle: string;
  done: boolean;
}

export type WarningSeverity = "info" | "warning" | "danger";

export interface Warning {
  id: string;
  title: string;
  message: string;
  severity: WarningSeverity;
  detail?: string;
  cta?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weightCurrent: number;
  weightGoal: number;
  weightStart: number;
  streak: number;
  targetCalories: number;
  targetMacros: Macros;
  targetWaterMl: number;
  workoutTitle: string;
  workoutFocus: string;
  workoutDurationMin: number;
}
