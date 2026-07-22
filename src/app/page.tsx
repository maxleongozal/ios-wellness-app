"use client";

import { useMemo, useState } from "react";
import { IphoneFrame } from "@/components/iphone-frame";
import { StatusBar } from "@/components/status-bar";
import { BottomNav } from "@/components/bottom-nav";
import { HomeScreen } from "@/components/screens/home";
import { NutritionScreen } from "@/components/screens/nutrition";
import { WorkoutScreen } from "@/components/screens/workout";
import { ProfileScreen } from "@/components/screens/profile";
import {
  exercises as seedExercises,
  meals,
  userProfile,
  warnings as seedWarnings,
} from "@/lib/data";
import type { ScreenId } from "@/types";

export default function HomePage() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [exercises, setExercises] = useState(seedExercises);
  const [waterMl, setWaterMl] = useState(1800);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const activeWarnings = useMemo(
    () => seedWarnings.filter((w) => !dismissed.includes(w.id)),
    [dismissed],
  );

  const toggleExercise = (id: string) =>
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));

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
        <StatusBar tone="light" />

        <div className="absolute inset-0 pt-9">
          {screen === "home" && (
            <HomeScreen
              profile={userProfile}
              meals={meals}
              waterMl={waterMl}
              onAddWater={() => setWaterMl((v) => Math.min(userProfile.targetWaterMl, v + 250))}
              warnings={activeWarnings}
              onDismissWarning={(id) => setDismissed((d) => [...d, id])}
            />
          )}
          {screen === "nutrition" && (
            <NutritionScreen profile={userProfile} meals={meals} />
          )}
          {screen === "workout" && (
            <WorkoutScreen profile={userProfile} exercises={exercises} onToggle={toggleExercise} />
          )}
          {screen === "profile" && <ProfileScreen profile={userProfile} />}
        </div>

        <BottomNav active={screen} onChange={setScreen} />
      </IphoneFrame>

      {/* Right meta */}
      <aside className="hidden xl:flex flex-col items-start ml-16 max-w-xs relative z-10">
        <div className="rounded-2xl bg-[var(--color-parchment)]/70 backdrop-blur px-4 py-3 border border-[var(--color-forest)]/15 shadow-sm">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-forest)]/70 font-bold">
            Aperçu produit
          </p>
          <p className="text-[13px] text-[var(--color-ink-soft)] mt-1 leading-snug max-w-[240px]">
            Prototype interactif — naviguez entre les écrans via la barre du bas.
          </p>
        </div>
      </aside>
    </main>
  );
}
