export type ScreenId = "home" | "nutrition" | "workout" | "profile";

/* ---------- Onboarding / moteur de personnalisation ---------- */

export type Biologie = "homme" | "femme";
export type Objectif = "perte_poids" | "prise_masse" | "endurance" | "bien_etre";
export type StanceSupplements = "open" | "against" | "hesitant";
export type DietType = "standard" | "vegan" | "keto";
export type ActivityLevel = "sedentaire" | "leger" | "modere" | "tres_actif";
export type SleepRange = "moins_6h" | "6_8h" | "8h_plus";

export type SupplementId =
  | "whey"
  | "creatine"
  | "omega3"
  | "multivitamines"
  | "electrolytes";

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
  /** Liste exacte des compléments acceptés — seuls eux apparaissent sur le Dashboard. */
  acceptedSupplements: SupplementId[];
  dietType: DietType;
  // Données physiologiques pour le futur moteur de calcul métabolique.
  age: number;
  heightCm: number;
  weightKg: number;
  weightGoalKg: number;
  /** Durée du plan en semaines — validée par le Gardien de Santé (≤ 1 kg/sem). */
  targetWeeks: number;
  activityLevel: ActivityLevel;
  sleep: SleepRange;
  restrictiveDietHistory: boolean;
  uiTheme: UiTheme;
}

export interface OnboardingAnswers {
  userName: string;
  biologie: Biologie | null;
  objectif: Objectif | null;
  /** null = pas encore répondu ; [] = « aucun complément » choisi explicitement. */
  acceptedSupplements: SupplementId[] | null;
  age: number;
  heightCm: number;
  weightKg: number;
  weightGoalKg: number | null;
  targetWeeks: number | null;
  activityLevel: ActivityLevel | null;
  sleep: SleepRange | null;
  restrictiveDietHistory: boolean | null;
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
