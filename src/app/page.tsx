"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { IphoneFrame } from "@/components/iphone-frame";
import { StatusBar } from "@/components/status-bar";
import { BottomNav } from "@/components/bottom-nav";
import { HomeScreen } from "@/components/screens/home";
import { NutritionScreen } from "@/components/screens/nutrition";
import { WorkoutScreen } from "@/components/screens/workout";
import { ProfileScreen } from "@/components/screens/profile";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import {
  clearUserConfig,
  deriveProfile,
  getWorkoutPlan,
  loadUserConfig,
  saveUserConfig,
} from "@/lib/user-config";
import { computeMetabolics } from "@/lib/metabolic-engine";
import { evaluateDailyWarnings } from "@/lib/health-guardian";
import { behaviorDaysFromGamification, detectBehaviorSignals } from "@/lib/safety";
import { getWeekProgress, loadGamificationState } from "@/lib/gamification";
import { getDoctorSafetyAlert } from "@/lib/doctor-engine";
import {
  consecutiveTrackedDays,
  consecutiveTrainingDays,
  daysSinceLastWorkout,
  loadInterventionHistory,
  recordShown,
  resetInterventionHistory,
  saveInterventionHistory,
  selectIntervention,
} from "@/lib/doctor-interventions";
import { dailyTracking, exercises as seedExercises, meals, userProfile } from "@/lib/data";
import type { ScreenId, UserConfig } from "@/types";

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [screen, setScreen] = useState<ScreenId>("home");
  const [exercises, setExercises] = useState(seedExercises);
  const [waterMl, setWaterMl] = useState(1800);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setConfig(loadUserConfig());
    setHydrated(true);
  }, []);

  // La UI se dessine en lisant le UserConfig.
  const profile = useMemo(
    () => (config ? deriveProfile(userProfile, config) : userProfile),
    [config],
  );

  // Warnings quotidiens (Gardien de Santé) + parole du Dr. Sane :
  // tous lisent le même journal du jour, ils ne se contredisent jamais.
  // Le médecin a deux registres : l'alerte de sécurité (hors quota) et
  // l'intervention contextuelle (une à la fois, plafonnée en fréquence).
  const { activeWarnings, doctorAdvice, doctorIntervention } = useMemo(() => {
    if (!config) return { activeWarnings: [], doctorAdvice: null, doctorIntervention: null };
    const now = new Date();
    const today = now.toLocaleDateString("sv-SE");
    const metabolics = computeMetabolics(config);
    const gamification = loadGamificationState();
    const dailyLog = {
      caloriesConsumed: meals.reduce((sum, m) => sum + m.calories, 0),
      fiberG: dailyTracking.fiberG,
      creatineTakenG: dailyTracking.creatineTakenG,
      waterMl,
      targetWaterMl: metabolics.waterMl,
    };
    // Veille comportementale (safety/behavior-watch) : interventions
    // explicatives du Dr Sane, affichées comme les autres warnings.
    const behaviorWarnings = detectBehaviorSignals({
      days: behaviorDaysFromGamification(gamification),
      today,
    }).map((i) => ({ id: i.id, title: i.title, message: i.message, severity: i.severity }));

    const safetyAlert = getDoctorSafetyAlert(config, dailyLog);
    const week = getWeekProgress(gamification, today);
    // Une alerte de sécurité occupe la bulle : pas d'intervention en plus.
    const intervention = safetyAlert
      ? null
      : selectIntervention(
          {
            today,
            hour: now.getHours(),
            config,
            targets: {
              calories: metabolics.targetCalories,
              waterMl: metabolics.waterMl,
              proteinG: metabolics.macros.protein,
            },
            workoutTitle: profile.workoutTitle,
            day: {
              mealsLogged: meals.length,
              caloriesConsumed: dailyLog.caloriesConsumed,
              fiberG: dailyLog.fiberG,
              waterMl,
              workoutDone: exercises.length > 0 && exercises.every((e) => e.done),
            },
            week: { activeDays: week.activeDays, targetDays: week.targetDays },
            consecutiveTrainingDays: consecutiveTrainingDays(gamification, today),
            consecutiveTrackedDays: consecutiveTrackedDays(gamification, today),
            daysSinceLastWorkout: daysSinceLastWorkout(gamification, today),
            weight: {
              startKg: profile.weightStart,
              currentKg: profile.weightCurrent,
              goalKg: profile.weightGoal,
            },
            // Pas encore journalisés dans le prototype : les situations
            // correspondantes restent silencieuses (convention null).
            yesterdayCalories: null,
            lastWeighInDate: null,
          },
          loadInterventionHistory(),
        );

    return {
      activeWarnings: [
        ...evaluateDailyWarnings(config, metabolics, dailyLog),
        ...behaviorWarnings,
      ].filter((w) => !dismissed.includes(w.id)),
      doctorAdvice: safetyAlert,
      doctorIntervention: intervention,
    };
  }, [config, waterMl, dismissed, exercises, profile]);

  // L'affichage compte dans les plafonds de fréquence (2/jour, pas de
  // répétition dans la semaine). recordShown est idempotent : les
  // re-rendus d'une même journée n'entament pas le quota.
  useEffect(() => {
    if (!doctorIntervention) return;
    const today = new Date().toLocaleDateString("sv-SE");
    saveInterventionHistory(
      recordShown(loadInterventionHistory(), doctorIntervention, today),
    );
  }, [doctorIntervention]);

  const handleOnboardingComplete = (c: UserConfig) => {
    saveUserConfig(c);
    setConfig(c);
    setExercises(getWorkoutPlan(c.objectif).exercises);
    setScreen("home");
  };

  const handleReset = () => {
    clearUserConfig();
    // Les plafonds de fréquence appartiennent à l'« utilisateur » :
    // rejouer l'onboarding repart d'une conversation vierge.
    resetInterventionHistory();
    setConfig(null);
    setExercises(seedExercises);
    setDismissed([]);
  };

  const toggleExercise = (id: string) =>
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));

  const showOnboarding = hydrated && !config;

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#e8dfc4]">
      {/* Botanical background accents */}
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[var(--color-forest)]/10 blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-[var(--color-forest)]/10 blur-3xl animate-pulse-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-[var(--color-cream-soft)]/40 blur-3xl" />

      {/* Left branding */}
      <aside className="hidden xl:flex flex-col items-end mr-16 max-w-xs relative z-10">
        <h1 className="text-6xl font-extrabold text-[var(--color-forest-deep)] tracking-tight">
          SaneFit
        </h1>
        <p className="text-[var(--color-ink-soft)] mt-3 text-right leading-relaxed text-sm max-w-[260px]">
          Votre coach nutrition et sport.
          <br />
          Atteignez vos objectifs sainement.
        </p>
      </aside>

      <IphoneFrame>
        <StatusBar tone={showOnboarding ? "dark" : "light"} />

        {!hydrated ? null : showOnboarding ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        ) : (
          <>
            <div className="absolute inset-0 pt-9">
              {screen === "home" && (
                <HomeScreen
                  profile={profile}
                  config={config}
                  meals={meals}
                  waterMl={waterMl}
                  onAddWater={() => setWaterMl((v) => Math.min(profile.targetWaterMl, v + 250))}
                  warnings={activeWarnings}
                  onDismissWarning={(id) => setDismissed((d) => [...d, id])}
                  doctorAdvice={doctorAdvice}
                  doctorIntervention={doctorIntervention}
                  onNavigate={setScreen}
                />
              )}
              {screen === "nutrition" && (
                <NutritionScreen profile={profile} meals={meals} />
              )}
              {screen === "workout" && (
                <WorkoutScreen profile={profile} exercises={exercises} onToggle={toggleExercise} />
              )}
              {screen === "profile" && <ProfileScreen profile={profile} config={config} />}
            </div>

            <BottomNav active={screen} onChange={setScreen} />
          </>
        )}
      </IphoneFrame>

      {/* Right meta */}
      <aside className="hidden xl:flex flex-col items-start ml-16 max-w-xs relative z-10 gap-3">
        <div className="rounded-2xl bg-[var(--color-parchment)]/70 backdrop-blur px-4 py-3 border border-[var(--color-forest)]/15 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-forest)]/70 font-bold">
            Aperçu produit
          </p>
          <p className="text-[13px] text-[var(--color-ink-soft)] mt-1 leading-snug max-w-[240px]">
            {showOnboarding
              ? "Onboarding hyper-personnalisé — vos réponses configurent la UI du dashboard."
              : "Prototype interactif — naviguez entre les écrans via la barre du bas."}
          </p>
        </div>
        {config ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-2xl bg-[var(--color-parchment)]/70 backdrop-blur px-4 py-2.5 border border-[var(--color-forest)]/15 shadow-sm text-[12px] font-semibold text-[var(--color-forest)] hover:bg-[var(--color-parchment)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
            Rejouer l&apos;onboarding
          </button>
        ) : null}
      </aside>
    </main>
  );
}
