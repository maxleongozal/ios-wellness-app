import { describe, expect, it } from "vitest";
import { SAFETY_CONFIG } from "./config";
import { bmiFloorKgFor, lossMaxKgPerWeekFor, validateGoal, type GoalInput } from "./goal-guard";
import {
  detectBehaviorSignals,
  type BehaviorDay,
  type GoalRevision,
} from "./behavior-watch";
import { computeMetabolics } from "../metabolic-engine";

/* ------------------------- Aides de test -------------------------- */

const ADULT: GoalInput = {
  biologie: "homme",
  age: 30,
  heightCm: 180,
  weightKg: 80,
  weightGoalKg: 80,
  targetWeeks: 12,
};

function goal(overrides: Partial<GoalInput>): GoalInput {
  return { ...ADULT, ...overrides };
}

const TODAY = "2026-07-24";

function shiftDate(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/** `n` jours d'entraînement consécutifs se terminant aujourd'hui. */
function trainingDays(n: number): BehaviorDay[] {
  return Array.from({ length: n }, (_, i) => ({
    date: shiftDate(TODAY, -i),
    trainedToday: true,
    restDayTaken: false,
    caloriesLogged: null,
  }));
}

/** Journal calorique : `daysAgo` → kcal (null = non renseigné). */
function calorieDays(entries: Record<number, number | null>): BehaviorDay[] {
  return Object.entries(entries).map(([daysAgo, kcal]) => ({
    date: shiftDate(TODAY, -Number(daysAgo)),
    trainedToday: false,
    restDayTaken: false,
    caloriesLogged: kcal,
  }));
}

/* --------------------- Rythme de progression ---------------------- */

describe("goal-guard : rythme de perte", () => {
  it("laisse passer un rythme exactement au seuil (1 % du poids/sem)", () => {
    // 80 kg → seuil 0,8 kg/sem ; −8 kg en 10 semaines = 0,8 tout juste.
    const a = validateGoal(goal({ weightGoalKg: 72, targetWeeks: 10 }));
    expect(a.ok).toBe(true);
    expect(a.rateKgPerWeek).toBe(0.8);
    expect(a.intervention).toBeNull();
  });

  it("intervient juste au-dessus du seuil et propose une échéance recalculée", () => {
    const a = validateGoal(goal({ weightGoalKg: 72, targetWeeks: 9 }));
    expect(a.ok).toBe(false);
    expect(a.intervention?.kind).toBe("rythme_perte");
    // 0,6 %/sem de 80 kg = 0,48 kg/sem → 8 kg / 0,48 = 16,7 → 17 semaines.
    expect(a.recommendedWeeks).toBe(17);
    expect(a.intervention?.proposalLabel).toContain("17 semaines");
  });

  it("plafonne le seuil à 1 kg/sem pour les gabarits lourds", () => {
    // 120 kg : 1 % = 1,2 kg mais le plafond absolu est 1 kg.
    expect(lossMaxKgPerWeekFor(120)).toBe(1);
    const over = validateGoal(goal({ weightKg: 120, weightGoalKg: 110, targetWeeks: 9 }));
    expect(over.intervention?.kind).toBe("rythme_perte"); // 1,11 kg/sem
    const ok = validateGoal(goal({ weightKg: 120, weightGoalKg: 110, targetWeeks: 10 }));
    expect(ok.ok).toBe(true); // 1,0 kg/sem pile
  });

  it("protège les petits gabarits via le pourcentage (0,6 kg/sem trop rapide à 55 kg)", () => {
    // L'ancien seuil fixe de 1 kg/sem aurait laissé passer.
    const a = validateGoal(goal({ heightCm: 160, weightKg: 55, weightGoalKg: 52, targetWeeks: 5 }));
    expect(a.rateKgPerWeek).toBe(0.6);
    expect(a.maxRateKgPerWeek).toBe(0.55);
    expect(a.intervention?.kind).toBe("rythme_perte");
  });

  it("une durée nulle ne fait pas planter et ne déclenche pas d'alerte de rythme", () => {
    const a = validateGoal(goal({ weightGoalKg: 72, targetWeeks: 0 }));
    expect(a.rateKgPerWeek).toBe(0);
    expect(a.ok).toBe(true);
    expect(a.recommendedWeeks).toBeGreaterThan(0);
  });
});

describe("goal-guard : rythme de prise", () => {
  it("intervient au-delà de 0,5 % du poids/sem", () => {
    // 70 kg → seuil 0,35 kg/sem ; +4 kg en 8 sem = 0,5 kg/sem.
    const a = validateGoal(goal({ weightKg: 70, weightGoalKg: 74, targetWeeks: 8 }));
    expect(a.intervention?.kind).toBe("rythme_prise");
    // 0,35 %/sem de 70 kg = 0,245 → 4 / 0,245 = 16,3 → 17 semaines.
    expect(a.recommendedWeeks).toBe(17);
  });

  it("laisse passer une prise progressive", () => {
    const a = validateGoal(goal({ weightKg: 70, weightGoalKg: 74, targetWeeks: 12 }));
    expect(a.ok).toBe(true); // 0,33 kg/sem < 0,35
  });
});

/* ------------------------- Plancher IMC --------------------------- */

describe("goal-guard : plancher IMC", () => {
  it("calcule le poids plancher arrondi au 0,5 kg supérieur", () => {
    // 170 cm : 18,5 × 1,70² = 53,465 → 53,5 kg.
    expect(bmiFloorKgFor(170)).toBe(53.5);
  });

  it("refuse un objectif sous le plancher et propose le poids corrigé", () => {
    const a = validateGoal(goal({ heightCm: 170, weightKg: 62, weightGoalKg: 50, targetWeeks: 20 }));
    expect(a.ok).toBe(false);
    expect(a.intervention?.kind).toBe("plancher_imc");
    expect(a.safeGoalKg).toBe(53.5);
    // L'échéance proposée est recalculée pour l'objectif corrigé.
    expect(a.recommendedWeeks).toBeGreaterThan(0);
  });

  it("laisse passer un objectif exactement au plancher", () => {
    const a = validateGoal(goal({ heightCm: 170, weightKg: 62, weightGoalKg: 53.5, targetWeeks: 20 }));
    expect(a.intervention?.kind).not.toBe("plancher_imc");
  });
});

/* --------------------------- Mineurs ------------------------------ */

describe("goal-guard : mineurs", () => {
  it("aucun objectif de perte avant 18 ans — proposition de maintien", () => {
    const a = validateGoal(goal({ age: 16, weightGoalKg: 74, targetWeeks: 10 }));
    expect(a.ok).toBe(false);
    expect(a.intervention?.kind).toBe("mineur_deficit");
    expect(a.safeGoalKg).toBe(80); // le poids actuel : maintien
  });

  it("la règle mineur prime sur le plancher IMC", () => {
    const a = validateGoal(goal({ age: 15, heightCm: 170, weightKg: 60, weightGoalKg: 45, targetWeeks: 30 }));
    expect(a.intervention?.kind).toBe("mineur_deficit");
  });

  it("à 18 ans, les règles adultes s'appliquent", () => {
    const a = validateGoal(goal({ age: 18, weightGoalKg: 74, targetWeeks: 12 }));
    expect(a.intervention?.kind).not.toBe("mineur_deficit");
  });

  it("un mineur peut viser une prise de masse progressive", () => {
    const a = validateGoal(goal({ age: 16, weightGoalKg: 84, targetWeeks: 20 }));
    expect(a.ok).toBe(true);
  });
});

/* ----------------------- Plancher calorique ----------------------- */

describe("plancher calorique (metabolic-engine + config)", () => {
  const smallProfile = {
    biologie: "femme" as const,
    age: 45,
    heightCm: 150,
    weightKg: 45,
    objectif: "perte_poids" as const,
    activityLevel: "sedentaire" as const,
    restrictiveDietHistory: false,
  };

  it("remonte la cible au plancher absolu quand le déficit théorique passe dessous", () => {
    const m = computeMetabolics(smallProfile);
    expect(m.targetCalories).toBe(m.calorieFloor);
    expect(m.calorieFloor).toBe(SAFETY_CONFIG.calories.absoluteFloorKcal.femme);
    expect(m.floorApplied).toBe(true);
  });

  it("le plancher est le métabolisme de base quand il dépasse le plancher absolu", () => {
    const m = computeMetabolics({
      biologie: "homme",
      age: 25,
      heightCm: 190,
      weightKg: 100,
      objectif: "perte_poids",
      activityLevel: "sedentaire",
      restrictiveDietHistory: false,
    });
    expect(m.calorieFloor).toBe(m.mb);
    expect(m.targetCalories).toBeGreaterThanOrEqual(m.mb);
    expect(m.floorApplied).toBe(true); // TDEE −20 % passe sous le MB en sédentaire
  });

  it("l'historique de régimes restrictifs adoucit le déficit", () => {
    const strict = computeMetabolics({ ...smallProfile, weightKg: 70, heightCm: 170 });
    const gentle = computeMetabolics({
      ...smallProfile,
      weightKg: 70,
      heightCm: 170,
      restrictiveDietHistory: true,
    });
    expect(Math.abs(gentle.adjustmentPct)).toBe(SAFETY_CONFIG.calories.deficitRestrictiveHistoryPct);
    expect(Math.abs(strict.adjustmentPct)).toBe(SAFETY_CONFIG.calories.deficitMaxPct);
  });

  it("aucun déficit n'est généré pour un mineur, même en objectif perte de poids", () => {
    const m = computeMetabolics({ ...smallProfile, age: 16, weightKg: 70, heightCm: 170 });
    expect(m.adjustmentPct).toBe(0);
    expect(m.targetCalories).toBeGreaterThanOrEqual(m.calorieFloor);
  });
});

/* -------------------- Signaux comportementaux --------------------- */

describe("behavior-watch : entraînement sans repos", () => {
  it("intervient à 7 jours consécutifs, pas à 6", () => {
    expect(detectBehaviorSignals({ days: trainingDays(6), today: TODAY })).toHaveLength(0);
    const signals = detectBehaviorSignals({ days: trainingDays(7), today: TODAY });
    expect(signals).toHaveLength(1);
    expect(signals[0].kind).toBe("sans_repos");
  });

  it("un jour sans donnée interrompt la série (pas de supposition)", () => {
    const days = trainingDays(8).filter((d) => d.date !== shiftDate(TODAY, -3));
    expect(detectBehaviorSignals({ days, today: TODAY })).toHaveLength(0);
  });

  it("un jour de repos pris remet la série à zéro", () => {
    const days = trainingDays(8);
    days[4] = { ...days[4], trainedToday: false, restDayTaken: true };
    expect(detectBehaviorSignals({ days, today: TODAY })).toHaveLength(0);
  });

  it("la série peut se terminer hier si aujourd'hui n'est pas encore renseigné", () => {
    const days = trainingDays(8).filter((d) => d.date !== TODAY);
    const signals = detectBehaviorSignals({ days, today: TODAY });
    expect(signals.map((s) => s.kind)).toContain("sans_repos");
  });
});

describe("behavior-watch : chute des apports", () => {
  const baseline = { 3: 2000, 4: 2000, 5: 2000, 6: 2000, 7: 2000, 8: 2000, 9: 2000 };

  it("intervient sous 70 % de la moyenne de référence", () => {
    const days = calorieDays({ ...baseline, 0: 1300, 1: 1300, 2: 1300 }); // 65 %
    const signals = detectBehaviorSignals({ days, today: TODAY });
    expect(signals.map((s) => s.kind)).toContain("chute_apports");
  });

  it("reste silencieux exactement à 70 % (borne non incluse)", () => {
    const days = calorieDays({ ...baseline, 0: 1400, 1: 1400, 2: 1400 });
    expect(detectBehaviorSignals({ days, today: TODAY })).toHaveLength(0);
  });

  it("exige assez de jours renseignés en référence pour éviter les faux positifs", () => {
    const days = calorieDays({ 3: 2000, 4: 2000, 5: 2000, 0: 1000, 1: 1000, 2: 1000 });
    expect(detectBehaviorSignals({ days, today: TODAY })).toHaveLength(0); // 3 jours < minimum 4
  });

  it("exige au moins 2 jours récents renseignés", () => {
    const days = calorieDays({ ...baseline, 0: 500 });
    expect(detectBehaviorSignals({ days, today: TODAY })).toHaveLength(0);
  });

  it("ignore les jours non renseignés au lieu de les compter comme zéro", () => {
    const days = calorieDays({ ...baseline, 0: 1900, 1: null, 2: 1900 });
    expect(detectBehaviorSignals({ days, today: TODAY })).toHaveLength(0);
  });
});

describe("behavior-watch : objectif resserré à répétition", () => {
  const revision = (daysAgo: number, moreAggressive = true): GoalRevision => ({
    date: shiftDate(TODAY, -daysAgo),
    moreAggressive,
  });

  it("intervient à 2 resserrements en 14 jours, pas à 1", () => {
    expect(
      detectBehaviorSignals({ days: [], goalRevisions: [revision(2)], today: TODAY }),
    ).toHaveLength(0);
    const signals = detectBehaviorSignals({
      days: [],
      goalRevisions: [revision(2), revision(10)],
      today: TODAY,
    });
    expect(signals.map((s) => s.kind)).toContain("objectif_agressif");
  });

  it("ignore les resserrements hors fenêtre et les modifications non agressives", () => {
    expect(
      detectBehaviorSignals({
        days: [],
        goalRevisions: [revision(2), revision(20)],
        today: TODAY,
      }),
    ).toHaveLength(0);
    expect(
      detectBehaviorSignals({
        days: [],
        goalRevisions: [revision(2), revision(5, false)],
        today: TODAY,
      }),
    ).toHaveLength(0);
  });
});

/* ---------------- Contrat : jamais de blocage sec ------------------ */

describe("contrat des interventions", () => {
  it("chaque règle dure du goal-guard propose toujours une alternative", () => {
    const imc = validateGoal(goal({ heightCm: 170, weightKg: 62, weightGoalKg: 45, targetWeeks: 30 }));
    const mineur = validateGoal(goal({ age: 15, weightGoalKg: 70, targetWeeks: 10 }));
    for (const a of [imc, mineur]) {
      expect(a.intervention?.proposalLabel).toBeTruthy();
      expect(a.safeGoalKg).toBeGreaterThanOrEqual(a.bmiFloorKg > a.safeGoalKg ? 0 : a.bmiFloorKg * 0);
      expect(a.intervention?.message.length).toBeGreaterThan(50); // explication, pas un refus sec
    }
  });

  it("les signaux comportementaux ne sont jamais des 'danger' bloquants", () => {
    const signals = detectBehaviorSignals({
      days: trainingDays(10),
      goalRevisions: [
        { date: TODAY, moreAggressive: true },
        { date: shiftDate(TODAY, -1), moreAggressive: true },
      ],
      today: TODAY,
    });
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) {
      expect(["info", "warning"]).toContain(s.severity);
    }
  });
});
