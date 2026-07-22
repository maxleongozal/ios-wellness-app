"use client";

import { Check, Dumbbell, Timer } from "lucide-react";
import type { Exercise, UserProfile } from "@/types";
import { ScreenHeader } from "@/components/screen-header";
import { cn } from "@/lib/utils";

interface WorkoutScreenProps {
  profile: UserProfile;
  exercises: Exercise[];
  onToggle: (id: string) => void;
}

const week = ["L", "M", "M", "J", "V", "S", "D"];
const todayIndex = 2; // Wed for demo

export function WorkoutScreen({ profile, exercises, onToggle }: WorkoutScreenProps) {
  const done = exercises.filter((e) => e.done).length;
  const total = exercises.length;
  const pct = total === 0 ? 0 : done / total;

  return (
    <div className="h-full flex flex-col">
      <ScreenHeader greeting="Sport" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-3">
        {/* Weekly calendar */}
        <div className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10">
          <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">Cette semaine</p>
          <div className="mt-3 flex justify-between">
            {week.map((d, i) => {
              const active = i === todayIndex;
              const past = i < todayIndex;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-[var(--color-muted)]">{d}</span>
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full text-[12px] font-bold flex items-center justify-center",
                      active && "bg-[var(--color-forest)] text-white",
                      !active && past && "bg-[var(--color-forest)]/15 text-[var(--color-forest)]",
                      !active && !past && "bg-white/70 text-[var(--color-muted)]",
                    )}
                  >
                    {past ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 20}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session summary */}
        <div className="bg-[var(--color-forest)] rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-extrabold uppercase tracking-wide">
                {profile.workoutTitle}
              </p>
              <p className="text-[11px] opacity-80">
                {profile.workoutFocus} · {profile.workoutDurationMin} min
              </p>
            </div>
            <div className="flex items-center gap-1 text-[12px] font-semibold bg-white/10 rounded-full px-2.5 py-1">
              <Timer className="w-3.5 h-3.5" strokeWidth={2.6} />
              <span>00:12</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="opacity-80">Progression</span>
              <span className="font-semibold">
                {done} / {total}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${pct * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Exercise list */}
        <div className="bg-[var(--color-parchment)] rounded-2xl p-4 border border-[var(--color-forest)]/10">
          <p className="text-[14px] font-extrabold text-[var(--color-forest-dark)]">Exercices</p>
          <ul className="mt-3 space-y-2">
            {exercises.map((e) => (
              <li
                key={e.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  e.done ? "bg-[var(--color-forest)]/10" : "bg-white/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggle(e.id)}
                  aria-label={e.done ? "Marquer comme non fait" : "Marquer comme fait"}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
                    e.done
                      ? "bg-[var(--color-forest)] border-[var(--color-forest)] text-white"
                      : "border-[var(--color-forest)]/30 text-transparent hover:border-[var(--color-forest)]",
                  )}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[12.5px] font-semibold text-[var(--color-ink)] truncate",
                      e.done && "line-through opacity-60",
                    )}
                  >
                    {e.name}
                  </p>
                  <p className="text-[10.5px] text-[var(--color-muted)]">
                    {e.sets} × {e.reps} · {e.muscle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
