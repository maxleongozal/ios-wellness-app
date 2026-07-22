export type ScreenId = "home" | "nutrition" | "workout" | "profile";

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
