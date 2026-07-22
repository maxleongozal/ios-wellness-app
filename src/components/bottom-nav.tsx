"use client";

import { LayoutGrid, Dumbbell, UtensilsCrossed, User } from "lucide-react";
import type { ScreenId } from "@/types";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: ScreenId;
  onChange: (id: ScreenId) => void;
}

const tabs: { id: ScreenId; label: string; Icon: typeof LayoutGrid }[] = [
  { id: "home", label: "Dashboard", Icon: LayoutGrid },
  { id: "workout", label: "Sport", Icon: Dumbbell },
  { id: "nutrition", label: "Recettes", Icon: UtensilsCrossed },
  { id: "profile", label: "Profil", Icon: User },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="absolute bottom-0 inset-x-0 z-40 bg-[var(--color-parchment)]/95 backdrop-blur-md border-t border-[var(--color-forest)]/10 pt-2 pb-6">
      <ul className="flex items-end justify-around px-3">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                className="w-full flex flex-col items-center gap-1 py-1 group"
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-2xl transition-colors",
                    isActive
                      ? "bg-[var(--color-forest)] text-white shadow-sm"
                      : "text-[var(--color-ink-soft)] group-hover:bg-[var(--color-forest)]/5",
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </span>
                <span
                  className={cn(
                    "text-[10.5px] font-semibold tracking-wide",
                    isActive
                      ? "text-[var(--color-forest)]"
                      : "text-[var(--color-ink-soft)]/70",
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
