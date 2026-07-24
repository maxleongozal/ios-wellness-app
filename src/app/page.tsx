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
import { getDoctorAdvice } from "@/lib/doctor-engine";
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

  // Warnings quotidiens (Gardien de Santé) + intervention du Dr. Sane :
  // tous deux lisent le même journal du jour, ils ne se contredisent jamais.
  const { activeWarnings, doctorAdvice } = useMemo(() => {
    if (!config) return { activeWarnings: [], doctorAdvice: null };
    const metabolics = computeMetabolics(config);
    const dailyLog = {
      caloriesConsumed: meals.reduce((sum, m) => sum + m.calories, 0),
      fiberG: dailyTracking.fiberG,
      creatineTakenG: dailyTracking.creatineTakenG,
      waterMl,
      targetWaterMl: metabolics.waterMl,
    };
    return {
      activeWarnings: evaluateDailyWarnings(config, metabolics, dailyLog).filter(
        (w) => !dismissed.includes(w.id),
      ),
      doctorAdvice: getDoctorAdvice(config, dailyLog),
    };
  }, [config, waterMl, dismissed]);

  const handleOnboardingComplete = (c: UserConfig) => {
    saveUserConfig(c);
    setConfig(c);
    setExercises(getWorkoutPlan(c.objectif).exercises);
    setScreen("home");
  };

  const handleReset = () => {
    clearUserConfig();
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
                />
              )}
              {screen === "nutrition" && (
                <NutritionScreen profile={profile} meals={meals} />
              )}
              {screen === "workout" && (
                <WorkoutScreen profile={profile} exercises={exercises} onToggle={toggleExercise} />
              )}
              {screen === "profile" && <ProfileScreen profile={profile} />}
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
