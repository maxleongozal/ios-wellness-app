"use client";

import { Coffee, Salad, Soup, Cookie, Plus } from "lucide-react";
import type { Meal, MealCategory, UserProfile } from "@/types";
import { ScreenHeader } from "@/components/screen-header";

interface NutritionScreenProps {
  profile: UserProfile;
  meals: Meal[];
}

const categoryLabels: Record<MealCategory, string> = {
  "petit-dejeuner": "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  snacks: "Snacks",
};

const categoryOrder: MealCategory[] = ["petit-dejeuner", "dejeuner", "diner", "snacks"];

const categoryIcon: Record<MealCategory, typeof Coffee> = {
  "petit-dejeuner": Coffee,
  dejeuner: Salad,
  diner: Soup,
  snacks: Cookie,
};

export function NutritionScreen({ profile, meals }: NutritionScreenProps) {
  const consumed = meals.reduce((sum, m) => sum + m.calories, 0);
  const remaining = Math.max(0, profile.targetCalories - consumed);

  return (
    <div className="h-full flex flex-col">
      <ScreenHeader greeting="Recettes" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-3">
        <div className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10">
          <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">
            Bilan calorique
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="text-[26px] font-extrabold text-[var(--color-ink)] tabular-nums">
              {consumed}
            </p>
            <p className="text-[13px] text-[var(--color-muted)]">/ {profile.targetCalories} kcal</p>
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-soft)] mt-1">
            {remaining} kcal restantes aujourd&apos;hui
          </p>
          <div className="mt-3 h-2 rounded-full bg-[var(--color-forest)]/10 overflow-hidden">
            <div
              className="h-full bg-[var(--color-forest)] rounded-full"
              style={{ width: `${Math.min(100, (consumed / profile.targetCalories) * 100)}%` }}
            />
          </div>
        </div>

        {categoryOrder.map((cat) => {
          const items = meals.filter((m) => m.category === cat);
          const Icon = categoryIcon[cat];
          const total = items.reduce((s, m) => s + m.calories, 0);
          return (
            <section
              key={cat}
              className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10"
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[var(--color-forest)]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[var(--color-forest)]" strokeWidth={2.4} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-extrabold text-[var(--color-forest-dark)]">
                      {categoryLabels[cat]}
                    </p>
                    <p className="text-[10.5px] text-[var(--color-muted)]">{total} kcal</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Ajouter un aliment"
                  className="w-8 h-8 rounded-full bg-[var(--color-forest)] text-white flex items-center justify-center hover:bg-[var(--color-forest-dark)] transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.6} />
                </button>
              </header>

              {items.length ? (
                <ul className="mt-3 space-y-2">
                  {items.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between bg-white/60 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-[var(--color-ink)] truncate">
                          {m.name}
                        </p>
                        <p className="text-[10.5px] text-[var(--color-muted)]">
                          {m.time} · P {m.macros.protein}g · G {m.macros.carbs}g · L {m.macros.fat}g
                        </p>
                      </div>
                      <span className="text-[12px] font-bold text-[var(--color-forest)]">
                        {m.calories}
                        <span className="text-[10px] font-medium text-[var(--color-muted)]"> kcal</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[11.5px] text-[var(--color-muted)] italic">
                  Aucun aliment enregistré.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
