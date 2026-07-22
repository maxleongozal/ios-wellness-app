"use client";

import { ChevronRight, Dumbbell, Droplets, Flame, HeartPulse } from "lucide-react";
import type { Meal, UserProfile, Warning } from "@/types";
import { ScreenHeader } from "@/components/screen-header";
import { WarningBanner } from "@/components/warning-banner";
import { cn } from "@/lib/utils";

interface HomeScreenProps {
  profile: UserProfile;
  meals: Meal[];
  waterMl: number;
  onAddWater: () => void;
  warnings: Warning[];
  onDismissWarning: (id: string) => void;
}

function MacroDot({
  letter,
  value,
  target,
  color,
}: {
  letter: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(1, value / target));
  const size = 34;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold" style={{ color }}>
          {letter}
        </div>
      </div>
    </div>
  );
}

export function HomeScreen({
  profile,
  meals,
  waterMl,
  onAddWater,
  warnings,
  onDismissWarning,
}: HomeScreenProps) {
  const consumedCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const consumedMacros = meals.reduce(
    (acc, m) => ({
      protein: acc.protein + m.macros.protein,
      carbs: acc.carbs + m.macros.carbs,
      fat: acc.fat + m.macros.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
  const calPct = Math.min(1, consumedCalories / profile.targetCalories);
  const waterPct = Math.min(1, waterMl / profile.targetWaterMl);
  const lastMeal = meals[meals.length - 1];

  return (
    <div className="h-full flex flex-col">
      <ScreenHeader greeting={`Bonjour ${profile.name} !`} />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-3">
        {warnings.slice(0, 1).map((w) => (
          <WarningBanner key={w.id} warning={w} onDismiss={onDismissWarning} />
        ))}

        {/* Top row: Aujourd'hui + Séance du Jour */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10">
            <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">Aujourd&apos;hui</p>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[var(--color-macro-l)]" strokeWidth={2.6} />
                <p className="text-[11px] font-semibold text-[var(--color-ink-soft)]">Calories</p>
              </div>
              <p className="text-[13px] font-bold text-[var(--color-ink)] mt-0.5">
                {consumedCalories}
                <span className="text-[11px] font-medium text-[var(--color-muted)]">
                  {" "}
                  / {profile.targetCalories} kcal
                </span>
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-[var(--color-forest)]/10 overflow-hidden">
                <div
                  className="h-full bg-[var(--color-forest)] rounded-full"
                  style={{ width: `${calPct * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold text-[var(--color-ink-soft)]">Macros</p>
              <p className="text-[10.5px] text-[var(--color-muted)] mt-0.5">
                P: {consumedMacros.protein}g · G: {consumedMacros.carbs}g · L: {consumedMacros.fat}g
              </p>
              <div className="mt-2 flex items-center gap-3">
                <MacroDot letter="P" value={consumedMacros.protein} target={profile.targetMacros.protein} color="var(--color-macro-p)" />
                <MacroDot letter="G" value={consumedMacros.carbs} target={profile.targetMacros.carbs} color="var(--color-macro-g)" />
                <MacroDot letter="L" value={consumedMacros.fat} target={profile.targetMacros.fat} color="var(--color-macro-l)" />
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10 flex flex-col">
            <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">Séance du Jour</p>
            <div className="mt-3 mx-auto w-14 h-14 rounded-2xl bg-[var(--color-forest)]/10 flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-[var(--color-forest)]" strokeWidth={2.4} />
            </div>
            <p className="mt-3 text-[12px] font-bold text-[var(--color-ink)] leading-tight text-center">
              {profile.workoutTitle}
            </p>
            <p className="text-[10.5px] text-[var(--color-muted)] text-center">
              ({profile.workoutFocus})
            </p>
            <div className="mt-auto pt-2 flex items-center justify-center gap-1 text-[11px] text-[var(--color-forest)] font-semibold">
              <span>⏱</span>
              <span>{profile.workoutDurationMin} mins</span>
            </div>
          </div>
        </div>

        {/* Nutrition card */}
        <button
          type="button"
          className="w-full bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10 text-left"
        >
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">Nutrition</p>
            <ChevronRight className="w-4 h-4 text-[var(--color-ink-soft)]" />
          </div>
          {lastMeal ? (
            <>
              <p className="text-[11.5px] text-[var(--color-ink-soft)] mt-1">
                Dernier repas : <span className="font-semibold">{lastMeal.name}</span>
              </p>
              <div className="mt-3 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-14 rounded-xl bg-gradient-to-br",
                      i === 0 && "from-[#c8dccf] to-[#8fb59c]",
                      i === 1 && "from-[#e0d3a8] to-[#b6a06a]",
                      i === 2 && "from-[#d9c4a3] to-[#a58255]",
                    )}
                  />
                ))}
              </div>
            </>
          ) : null}
        </button>

        {/* Water */}
        <div className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10">
          <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">Suivi d&apos;Hydratation</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[12px] text-[var(--color-ink)] font-semibold">
                {(waterMl / 1000).toFixed(1)}L
                <span className="text-[var(--color-muted)] font-normal"> / {(profile.targetWaterMl / 1000).toFixed(1)}L</span>
              </p>
              <div className="mt-2 h-2 rounded-full bg-[var(--color-forest)]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5aa8d1] to-[#2d7fa8]"
                  style={{ width: `${waterPct * 100}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={onAddWater}
              aria-label="Ajouter 250 ml"
              className="w-11 h-11 rounded-full bg-white ring-2 ring-[#5aa8d1] flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Droplets className="w-5 h-5 text-[#2d7fa8]" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Bien-être */}
        <button
          type="button"
          className="w-full bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10 text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">Bien-être</p>
              <p className="text-[11.5px] text-[var(--color-ink-soft)] mt-1">
                Comment vous sentez-vous ?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-[var(--color-forest)]" />
              <ChevronRight className="w-4 h-4 text-[var(--color-ink-soft)]" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
