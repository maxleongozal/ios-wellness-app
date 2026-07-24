import { describe, expect, it } from "vitest";
import type { UserConfig } from "@/types";
import { SAFETY_CONFIG } from "@/lib/safety";
import { createInitialState } from "@/lib/gamification";
import {
  consecutiveTrainingDays,
  daysSinceLastWorkout,
} from "./context";
import {
  MAX_INTERVENTIONS_PER_DAY,
  createEmptyHistory,
  recordShown,
  selectIntervention,
} from "./engine";
import type { InterventionContext, InterventionHistory } from "./types";

/* ------------------------- Aides de test -------------------------- */

const CONFIG: UserConfig = {
  userName: "Alex",
  biologie: "homme",
  objectif: "perte_poids",
  stanceSupplements: "against",
  acceptedSupplements: [],
  dietType: "standard",
  age: 28,
  heightCm: 178,
  weightKg: 76.4,
  weightGoalKg: 72,
  targetWeeks: 12,
  activityLevel: "modere",
  sleep: "6_8h",
  restrictiveDietHistory: false,
  uiTheme: { accentColor: "#e58a2b", visibleModules: ["dashboard"] },
};

// Vendredi ; le lundi de sa semaine ISO est le 2026-07-20.
const TODAY = "2026-07-24";
const SAME_WEEK_DAY = "2026-07-22";
const NEXT_WEEK_DAY = "2026-07-27";

/** Contexte de base volontairement muet : aucune situation ne matche. */
function ctx(overrides: Partial<InterventionContext> = {}): InterventionContext {
  return {
    today: TODAY,
    hour: 12,
    config: CONFIG,
    targets: { calories: 2200, waterMl: 2500, proteinG: 150 },
    workoutTitle: "HIIT Brûle-Graisses",
    day: {
      mealsLogged: 2,
      caloriesConsumed: 1400,
      fiberG: 30,
      waterMl: 1500,
      workoutDone: false,
    },
    week: { activeDays: 2, targetDays: 4 },
    consecutiveTrainingDays: 0,
    consecutiveTrackedDays: 3,
    daysSinceLastWorkout: 1,
    weight: { startKg: 76.4, currentKg: 76.4, goalKg: 76.4 },
    yesterdayCalories: null,
    lastWeighInDate: null,
    ...overrides,
  };
}

function historyWith(entries: { id: string; date: string }[]): InterventionHistory {
  return { version: 1, shown: entries, celebratedMilestones: [] };
}

/* ----------------------- Détection de base ------------------------ */

describe("détection des situations", () => {
  it("reste silencieux quand rien n'est pertinent", () => {
    expect(selectIntervention(ctx(), createEmptyHistory())).toBeNull();
  });

  it("briefe le matin quand la journée est vide, avec les cibles interpolées", () => {
    const res = selectIntervention(
      ctx({ hour: 8, day: { ...ctx().day, mealsLogged: 0 } }),
      createEmptyHistory(),
    );
    expect(res?.id).toBe("briefing_matin");
    expect(res?.tone).toBe("information");
    expect(res?.message).toContain("Alex");
    expect(res?.message).toContain("2200 kcal");
    expect(res?.message).toContain("HIIT Brûle-Graisses");
    expect(res?.cta?.screen).toBe("workout");
  });

  it("signale l'absence de données l'après-midi", () => {
    const res = selectIntervention(
      ctx({ hour: 15, day: { ...ctx().day, mealsLogged: 0 } }),
      createEmptyHistory(),
    );
    expect(res?.id).toBe("donnees_manquantes");
  });

  it("calcule les fibres manquantes du soir à partir du seuil partagé", () => {
    const res = selectIntervention(
      ctx({ hour: 19, day: { ...ctx().day, fiberG: 14 } }),
      createEmptyHistory(),
    );
    expect(res?.id).toBe("fibres_basses_soir");
    expect(res?.message).toContain(
      `${SAFETY_CONFIG.dailyIntake.fiberTargetG - 14} g de fibres`,
    );
  });

  it("suggère le repos UN jour avant le seuil de sécurité de behavior-watch", () => {
    const soft = SAFETY_CONFIG.behavior.noRestConsecutiveDays - 1;
    expect(
      selectIntervention(ctx({ consecutiveTrainingDays: soft - 1 }), createEmptyHistory()),
    ).toBeNull();
    const res = selectIntervention(
      ctx({ consecutiveTrainingDays: soft }),
      createEmptyHistory(),
    );
    expect(res?.id).toBe("repos_a_prevoir");
  });

  it("les situations sans données (veille, pesée) restent silencieuses sur null", () => {
    // yesterdayCalories et lastWeighInDate à null dans le contexte de base :
    // aucune des deux situations ne doit se déclencher (déjà couvert par le
    // silence global), mais elles se déclenchent dès que la donnée existe.
    const veille = selectIntervention(
      ctx({ yesterdayCalories: 2700 }),
      createEmptyHistory(),
    );
    expect(veille?.id).toBe("ecart_calorique_veille");
    expect(veille?.message).toContain("500 kcal");

    const pesee = selectIntervention(
      ctx({ lastWeighInDate: "2026-07-10" }),
      createEmptyHistory(),
    );
    expect(pesee?.id).toBe("pesee_hebdo");
  });
});

/* --------------------------- Priorité ----------------------------- */

describe("arbitrage", () => {
  it("l'alerte douce prime sur la félicitation, qui prime sur l'information", () => {
    // hydratation_en_retard (alerte) + seance_terminee (félicitation).
    const both = ctx({
      hour: 16,
      day: { ...ctx().day, waterMl: 500, workoutDone: true },
    });
    expect(selectIntervention(both, createEmptyHistory())?.id).toBe("hydratation_en_retard");

    // Sans l'alerte, la félicitation gagne sur une information simultanée.
    const felicitation = ctx({
      hour: 15,
      day: { ...ctx().day, mealsLogged: 0, workoutDone: true },
    });
    expect(selectIntervention(felicitation, createEmptyHistory())?.id).toBe("seance_terminee");
  });
});

/* ---------------------- Plafonds de fréquence ---------------------- */

describe("plafonds de fréquence", () => {
  const morning = () => ctx({ hour: 8, day: { ...ctx().day, mealsLogged: 0 } });

  it("n'affiche jamais plus de deux interventions distinctes par jour", () => {
    const saturated = historyWith([
      { id: "seance_terminee", date: TODAY },
      { id: "hydratation_atteinte", date: TODAY },
    ]);
    expect(saturated.shown).toHaveLength(MAX_INTERVENTIONS_PER_DAY);
    expect(selectIntervention(morning(), saturated)).toBeNull();
  });

  it("laisse l'intervention du jour affichée malgré le plafond atteint", () => {
    const saturated = historyWith([
      { id: "briefing_matin", date: TODAY },
      { id: "hydratation_atteinte", date: TODAY },
    ]);
    expect(selectIntervention(morning(), saturated)?.id).toBe("briefing_matin");
  });

  it("ne répète jamais le même message dans une même semaine ISO", () => {
    const seen = historyWith([{ id: "briefing_matin", date: SAME_WEEK_DAY }]);
    expect(selectIntervention(morning(), seen)).toBeNull();

    // La semaine suivante, le message redevient éligible.
    const nextWeek = { ...morning(), today: NEXT_WEEK_DAY };
    expect(selectIntervention(nextWeek, seen)?.id).toBe("briefing_matin");
  });
});

/* ------------------------ Paliers de poids ------------------------- */

describe("paliers", () => {
  const losing = () =>
    ctx({ weight: { startKg: 82, currentKg: 76.4, goalKg: 72 } }); // 56 % du chemin

  it("célèbre le palier atteint puis ne le re-célèbre jamais", () => {
    const first = selectIntervention(losing(), createEmptyHistory());
    expect(first?.id).toBe("palier_poids");
    expect(first?.tone).toBe("felicitation");
    expect(first?.message).toContain("50 %");

    const after = recordShown(createEmptyHistory(), first!, TODAY);
    expect(after.celebratedMilestones).toContain("palier_poids:50");

    // Même une semaine plus tard, le palier 50 ne revient pas…
    expect(selectIntervention({ ...losing(), today: NEXT_WEEK_DAY }, after)).toBeNull();

    // …mais le palier suivant, lui, se déclenche.
    const further = ctx({
      today: NEXT_WEEK_DAY,
      weight: { startKg: 82, currentKg: 74, goalKg: 72 }, // 80 % du chemin
    });
    expect(selectIntervention(further, after)?.message).toContain("75 %");
  });
});

/* ------------------------- Historique ------------------------------ */

describe("recordShown", () => {
  it("est idempotent pour une même journée", () => {
    const intervention = selectIntervention(
      ctx({ hour: 8, day: { ...ctx().day, mealsLogged: 0 } }),
      createEmptyHistory(),
    )!;
    const once = recordShown(createEmptyHistory(), intervention, TODAY);
    const twice = recordShown(once, intervention, TODAY);
    expect(twice.shown).toHaveLength(1);
  });

  it("élague les entrées au-delà de la fenêtre de rétention", () => {
    const old = historyWith([{ id: "bilan_soir", date: "2026-06-01" }]);
    const intervention = selectIntervention(
      ctx({ hour: 8, day: { ...ctx().day, mealsLogged: 0 } }),
      createEmptyHistory(),
    )!;
    const next = recordShown(old, intervention, TODAY);
    expect(next.shown.map((e) => e.id)).toEqual(["briefing_matin"]);
  });
});

/* --------------------- Lectures du journal ------------------------- */

describe("contexte depuis la gamification", () => {
  it("compte les jours d'entraînement consécutifs et l'inactivité", () => {
    const state = createInitialState();
    const workout = { actions: { seance_terminee: 1 }, xp: 25, active: true, lessonsRead: 0 };
    state.days["2026-07-22"] = { ...workout };
    state.days["2026-07-23"] = { ...workout };

    // Série finissant hier : comptée ; aucune séance aujourd'hui.
    expect(consecutiveTrainingDays(state, TODAY)).toBe(2);
    expect(daysSinceLastWorkout(state, TODAY)).toBe(1);

    // Aucun entraînement journalisé → inactivité inconnue, pas 0.
    expect(daysSinceLastWorkout(createInitialState(), TODAY)).toBeNull();
  });
});
