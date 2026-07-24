import { describe, expect, it } from "vitest";
import {
  createInitialState,
  getLevel,
  getNextLevel,
  getUnlockedLessons,
  getWeekProgress,
  isoWeekKey,
  recordDay,
} from "./engine";
import {
  GAMIFICATION_RULES,
  JOKERS_PER_MONTH,
  LEVELS,
  WORKOUT_REST_POINTS,
} from "./rules";
import {
  loadGamificationState,
  resetGamification,
  saveGamificationState,
} from "./storage";
import type { DailyActivity, GamificationState } from "./types";

/* ------------------------- Aides de test -------------------------- */

const EMPTY: Omit<DailyActivity, "date"> = {
  mealsLogged: 0,
  proteinTargetMet: false,
  sleepHours: null,
  plannedWorkoutDone: false,
  plannedRestDay: false,
  waterTargetMet: false,
  lessonsRead: 0,
};

function day(date: string, overrides: Partial<DailyActivity> = {}): DailyActivity {
  return { date, ...EMPTY, ...overrides };
}

function run(activities: DailyActivity[], state = createInitialState()): GamificationState {
  return activities.reduce((acc, a) => recordDay(acc, a), state);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Une semaine (lundi `monday`) avec `activeDays` jours actifs (1 repas chacun). */
function activeWeek(monday: string, activeDays: number): DailyActivity[] {
  return Array.from({ length: activeDays }, (_, i) => day(addDays(monday, i), { mealsLogged: 1 }));
}

// Lundis consécutifs de mars-avril 2026 (2026-03-02 est un lundi).
const W10 = "2026-03-02";
const W11 = "2026-03-09";
const W12 = "2026-03-16";
const W13 = "2026-03-23";
const W14 = "2026-03-30";
const W15 = "2026-04-06";
const W16 = "2026-04-13";

/* ----------------------- Calcul des points ------------------------ */

describe("calcul des points", () => {
  it("chaque repas renseigné rapporte 10 XP, plafonné à 4 par jour", () => {
    const s = run([day(W10, { mealsLogged: 6 })]);
    expect(s.xpTotal).toBe(40);
    expect(s.counters.mealsLogged).toBe(4);
  });

  it("une journée parfaite avec séance rapporte 120 XP", () => {
    const s = run([
      day(W10, {
        mealsLogged: 4,
        proteinTargetMet: true,
        sleepHours: 7.5,
        plannedWorkoutDone: true,
        waterTargetMet: true,
      }),
    ]);
    expect(s.xpTotal).toBe(120);
  });

  it("un jour de repos parfait rapporte exactement autant qu'un jour de séance parfait", () => {
    const workoutDay = run([
      day(W10, {
        mealsLogged: 4,
        proteinTargetMet: true,
        sleepHours: 8,
        plannedWorkoutDone: true,
        waterTargetMet: true,
      }),
    ]);
    const restDay = run([
      day(W10, {
        mealsLogged: 4,
        proteinTargetMet: true,
        sleepHours: 8,
        plannedRestDay: true,
        waterTargetMet: true,
      }),
    ]);
    expect(restDay.xpTotal).toBe(workoutDay.xpTotal);
  });

  it("mécanique signature : la règle du repos vaut exactement celle de la séance", () => {
    const workout = GAMIFICATION_RULES.find((r) => r.id === "seance_terminee");
    const rest = GAMIFICATION_RULES.find((r) => r.id === "jour_de_repos");
    expect(workout?.points).toBe(WORKOUT_REST_POINTS);
    expect(rest?.points).toBe(WORKOUT_REST_POINTS);
  });

  it("s'entraîner un jour de repos : la séance compte, le repos ne rapporte rien", () => {
    const s = run([day(W10, { plannedRestDay: true, plannedWorkoutDone: true })]);
    expect(s.xpTotal).toBe(WORKOUT_REST_POINTS);
    expect(s.days[W10].actions["jour_de_repos"]).toBeUndefined();
  });

  it("dormir moins de 7 h ne rapporte rien — sans pénalité", () => {
    const s = run([day(W10, { sleepHours: 5 })]);
    expect(s.xpTotal).toBe(0);
    expect(s.days[W10].active).toBe(false);
  });

  it("re-signaler la même journée ne double pas les points", () => {
    const activity = day(W10, { mealsLogged: 2, plannedWorkoutDone: true });
    const s = run([activity, activity]);
    expect(s.xpTotal).toBe(45);
    expect(s.counters.mealsLogged).toBe(2);
  });

  it("effet cliquet : une donnée corrigée à la baisse ne reprend jamais de points", () => {
    const s = run([day(W10, { mealsLogged: 3 }), day(W10, { mealsLogged: 1 })]);
    expect(s.xpTotal).toBe(30);
  });

  it("l'état d'entrée n'est pas muté", () => {
    const initial = createInitialState();
    recordDay(initial, day(W10, { mealsLogged: 2 }));
    expect(initial.xpTotal).toBe(0);
  });
});

/* --------------------- Score de régularité ------------------------ */

describe("score de régularité hebdomadaire", () => {
  it("4 jours actifs sur 7 = semaine réussie", () => {
    const s = run([...activeWeek(W10, 4), day(W11)]);
    expect(s.weeks[isoWeekKey(W10)].outcome).toBe("reussie");
    expect(s.counters.weeksSucceeded).toBe(1);
  });

  it("la semaine en cours reste en_cours et expose sa progression", () => {
    const s = run(activeWeek(W10, 2));
    const progress = getWeekProgress(s, addDays(W10, 3));
    expect(progress.outcome).toBe("en_cours");
    expect(progress.activeDays).toBe(2);
    expect(progress.targetDays).toBe(4);
  });

  it("une semaine à 3 jours actifs est absorbée par un joker", () => {
    const s = run([...activeWeek(W10, 3), day(W11)]);
    expect(s.weeks[isoWeekKey(W10)].outcome).toBe("joker");
    expect(s.jokersRemaining).toBe(JOKERS_PER_MONTH - 1);
    expect(s.counters.weeksSucceeded).toBe(1);
  });

  it("sans joker, la semaine est manquée — sans aucune perte d'acquis", () => {
    // Deux semaines ratées épuisent les jokers du mois.
    let s = run([...activeWeek(W10, 1), ...activeWeek(W11, 1), ...activeWeek(W12, 1)]);
    const xpBefore = s.xpTotal;
    const succeededBefore = s.counters.weeksSucceeded;
    // La clôture de W12 (troisième semaine ratée) ne retire rien.
    s = run([day(W13, { mealsLogged: 1 })], s);
    expect(s.weeks[isoWeekKey(W12)].outcome).toBe("manquee");
    expect(s.jokersRemaining).toBe(0);
    expect(s.xpTotal).toBe(xpBefore + 10);
    expect(s.counters.weeksSucceeded).toBe(succeededBefore);
  });

  it("une semaine sans aucune donnée n'est jamais évaluée", () => {
    // W10 réussie, W11-W12 vides, reprise en W13 : aucun joker consommé
    // pour les semaines vides, un seul pour W13 (1 jour actif).
    const s = run([...activeWeek(W10, 4), day(W13, { mealsLogged: 1 }), day(W14)]);
    expect(s.weeks[isoWeekKey(W11)]).toBeUndefined();
    expect(s.weeks[isoWeekKey(W13)].outcome).toBe("joker");
    expect(s.jokersRemaining).toBe(JOKERS_PER_MONTH - 1);
  });
});

/* --------------------------- Jokers ------------------------------- */

describe("jokers", () => {
  it("rechargés à 2 au changement de mois, sans cumul", () => {
    // Mars : deux jokers consommés puis une semaine manquée.
    let s = run([
      ...activeWeek(W10, 1),
      ...activeWeek(W11, 1),
      ...activeWeek(W12, 1),
      day(W13),
    ]);
    expect(s.jokersRemaining).toBe(0);
    expect(s.weeks[isoWeekKey(W12)].outcome).toBe("manquee");
    // Avril : une semaine ratée est de nouveau absorbée.
    s = run([...activeWeek(W15, 2), day(W16)], s);
    expect(s.weeks[isoWeekKey(W15)].outcome).toBe("joker");
    expect(s.jokersRemaining).toBe(JOKERS_PER_MONTH - 1);
  });

  it("un mois sans consommation ne cumule pas au-delà de 2", () => {
    const s = run([...activeWeek(W10, 4), day(W15, { mealsLogged: 1 })]);
    expect(s.jokersRemaining).toBe(JOKERS_PER_MONTH);
  });
});

/* ---------------- Chaîne de récupération (badge) ------------------ */

describe("chaîne de récupération", () => {
  const restWeek = (monday: string) => [
    ...activeWeek(monday, 4),
    day(addDays(monday, 5), { plannedRestDay: true }),
  ];

  it("avance avec un jour de repos, se fige sans jamais repartir de zéro", () => {
    let s = run([...restWeek(W10), ...restWeek(W11)]);
    s = run([...activeWeek(W12, 4), day(W13)], s); // W12 sans repos
    expect(s.counters.restWeekChain).toBe(2); // figée, pas remise à zéro
    s = run([...restWeek(W13), day(W15)], s);
    expect(s.counters.restWeekChain).toBe(3); // elle reprend là où elle était
  });
});

/* --------------------------- Badges ------------------------------- */

describe("badges", () => {
  it("premier_pas dès la première action", () => {
    const s = run([day(W10, { mealsLogged: 1 })]);
    expect(s.badges["premier_pas"]).toBe(W10);
  });

  it("carnet_ouvert après 30 repas cumulés", () => {
    const activities = Array.from({ length: 8 }, (_, i) =>
      day(addDays(W10, i), { mealsLogged: 4 }),
    );
    const s = run(activities);
    expect(s.counters.mealsLogged).toBe(32);
    expect(s.badges["carnet_ouvert"]).toBeDefined();
  });

  it("nuits_reparatrices après 14 nuits de 7 h", () => {
    const activities = Array.from({ length: 14 }, (_, i) =>
      day(addDays(W10, i), { sleepHours: 7 }),
    );
    const s = run(activities);
    expect(s.badges["nuits_reparatrices"]).toBeDefined();
  });

  it("retour_gagnant : réussir la semaine qui suit une semaine manquée", () => {
    // Trois semaines ratées (2 jokers puis une manquée), puis une réussie.
    const s = run([
      ...activeWeek(W10, 1),
      ...activeWeek(W11, 1),
      ...activeWeek(W12, 1),
      ...activeWeek(W13, 4),
      day(W15),
    ]);
    expect(s.weeks[isoWeekKey(W12)].outcome).toBe("manquee");
    expect(s.weeks[isoWeekKey(W13)].outcome).toBe("reussie");
    expect(s.badges["retour_gagnant"]).toBeDefined();
  });

  it("esprit_curieux après 5 leçons lues", () => {
    const s = run([day(W10, { lessonsRead: 3 }), day(addDays(W10, 1), { lessonsRead: 2 })]);
    expect(s.counters.lessonsRead).toBe(5);
    expect(s.badges["esprit_curieux"]).toBeDefined();
  });
});

/* -------------------------- Niveaux ------------------------------- */

describe("niveaux", () => {
  it("les seuils déterminent le niveau, qui ne peut que monter", () => {
    expect(getLevel(0).level).toBe(1);
    expect(getLevel(299).level).toBe(1);
    expect(getLevel(300).level).toBe(2);
    expect(getLevel(999_999).level).toBe(LEVELS[LEVELS.length - 1].level);
  });

  it("chaque niveau débloque des leçons supplémentaires du Dr Sane", () => {
    const before = getUnlockedLessons(0).length;
    const after = getUnlockedLessons(300).length;
    expect(before).toBeGreaterThan(0);
    expect(after).toBeGreaterThan(before);
    expect(getNextLevel(0)?.minXp).toBe(300);
    expect(getNextLevel(999_999)).toBeNull();
  });
});

/* ------------------ Garde-fous de la charte ----------------------- */

describe("charte : aucune récompense sur un résultat corporel", () => {
  it("aucune règle ne lit un poids, des calories, un déficit ou un jeûne", () => {
    const forbidden = /poids|weight|imc|bmi|calor|kcal|d[ée]ficit|je[uû]ne|fast/i;
    for (const rule of GAMIFICATION_RULES) {
      expect(rule.trigger.toString()).not.toMatch(forbidden);
    }
  });

  it("tous les points sont positifs : la sanction est l'absence de gain, jamais une perte", () => {
    for (const rule of GAMIFICATION_RULES) {
      expect(rule.points).toBeGreaterThan(0);
      expect(rule.maxPerDay).toBeGreaterThan(0);
    }
  });
});

/* ------------------------ Persistance ----------------------------- */

describe("persistance", () => {
  function withFakeStorage(fn: () => void) {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    try {
      fn();
    } finally {
      // @ts-expect-error nettoyage du stub
      delete globalThis.localStorage;
    }
  }

  it("sauvegarde puis recharge l'état à l'identique", () => {
    withFakeStorage(() => {
      const s = run([day(W10, { mealsLogged: 2, plannedWorkoutDone: true })]);
      saveGamificationState(s);
      expect(loadGamificationState()).toEqual(s);
    });
  });

  it("resetGamification repart d'un état neuf", () => {
    withFakeStorage(() => {
      saveGamificationState(run([day(W10, { mealsLogged: 2 })]));
      resetGamification();
      expect(loadGamificationState().xpTotal).toBe(0);
    });
  });

  it("sans stockage disponible, charge un état neuf sans planter", () => {
    expect(loadGamificationState().xpTotal).toBe(0);
  });
});
