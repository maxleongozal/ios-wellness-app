"use client";

import { Flame, Ruler, Target, Trophy } from "lucide-react";
import type { UserProfile } from "@/types";
import { ScreenHeader } from "@/components/screen-header";

interface ProfileScreenProps {
  profile: UserProfile;
}

export function ProfileScreen({ profile }: ProfileScreenProps) {
  const lost = Math.max(0, profile.weightStart - profile.weightCurrent);
  const totalToLose = Math.max(0.1, profile.weightStart - profile.weightGoal);
  const pct = Math.min(1, lost / totalToLose);

  return (
    <div className="h-full flex flex-col">
      <ScreenHeader greeting="Profil" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-3">
        {/* Identity card */}
        <div className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-forest)] text-white flex items-center justify-center text-[20px] font-extrabold">
            {profile.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold text-[var(--color-ink)]">{profile.name}</p>
            <p className="text-[11.5px] text-[var(--color-muted)]">
              {profile.age} ans · {profile.height} cm
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[var(--color-forest)]/10 rounded-full px-2.5 py-1">
            <Flame className="w-3.5 h-3.5 text-[var(--color-macro-l)]" strokeWidth={2.6} />
            <span className="text-[11.5px] font-extrabold text-[var(--color-forest)]">
              {profile.streak} j
            </span>
          </div>
        </div>

        {/* Weight goal */}
        <div className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">
              Objectif de poids
            </p>
            <Target className="w-4 h-4 text-[var(--color-forest)]" strokeWidth={2.4} />
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-[var(--color-muted)]">Actuel</p>
              <p className="text-[22px] font-extrabold text-[var(--color-ink)] tabular-nums">
                {profile.weightCurrent}
                <span className="text-[12px] font-medium text-[var(--color-muted)]"> kg</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[var(--color-muted)]">Objectif</p>
              <p className="text-[22px] font-extrabold text-[var(--color-forest)] tabular-nums">
                {profile.weightGoal}
                <span className="text-[12px] font-medium text-[var(--color-muted)]"> kg</span>
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[var(--color-forest)]/10 overflow-hidden">
            <div
              className="h-full bg-[var(--color-forest)] rounded-full"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[11.5px] text-[var(--color-ink-soft)]">
            {lost.toFixed(1)} kg perdus · encore{" "}
            {Math.max(0, profile.weightCurrent - profile.weightGoal).toFixed(1)} kg
          </p>
        </div>

        {/* Daily targets */}
        <div className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10">
          <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">
            Objectifs quotidiens
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            <li className="bg-white/60 rounded-xl px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--color-muted)]">Calories</p>
              <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
                {profile.targetCalories} kcal
              </p>
            </li>
            <li className="bg-white/60 rounded-xl px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--color-muted)]">Eau</p>
              <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
                {(profile.targetWaterMl / 1000).toFixed(1)} L
              </p>
            </li>
            <li className="bg-white/60 rounded-xl px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--color-muted)]">Protéines</p>
              <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
                {profile.targetMacros.protein} g
              </p>
            </li>
            <li className="bg-white/60 rounded-xl px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--color-muted)]">Glucides</p>
              <p className="text-[15px] font-extrabold text-[var(--color-ink)]">
                {profile.targetMacros.carbs} g
              </p>
            </li>
          </ul>
        </div>

        {/* Achievements */}
        <div className="bg-[var(--color-forest)] rounded-2xl p-4 text-white flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
            <Trophy className="w-5 h-5" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-extrabold uppercase tracking-wide">
              Série de {profile.streak} jours
            </p>
            <p className="text-[11px] opacity-85">Continuez comme ça, {profile.name} !</p>
          </div>
          <Ruler className="w-4 h-4 opacity-70" />
        </div>
      </div>
    </div>
  );
}
