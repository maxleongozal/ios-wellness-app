import type { GamificationState } from "@/lib/gamification";
import { SAFETY_CONFIG } from "./config";
import type { SafetyIntervention } from "./types";

/* ------------------------------------------------------------------ */
/* Veille comportementale : détecte des motifs à risque dans le       */
/* journal (entraînement sans repos, chute des apports renseignés,    */
/* objectif resserré de façon répétée). Chaque motif déclenche une    */
/* intervention explicative du Dr Sane — JAMAIS un blocage, jamais    */
/* un message culpabilisant. Les fenêtres numériques sont des         */
/* heuristiques produit, documentées comme telles dans config.ts.     */
/* Moteur pur : la date du jour est fournie en entrée.                */
/* ------------------------------------------------------------------ */

export interface BehaviorDay {
  /** Date locale "YYYY-MM-DD". */
  date: string;
  trainedToday: boolean;
  restDayTaken: boolean;
  /** kcal renseignées ce jour, null si rien n'a été journalisé. */
  caloriesLogged: number | null;
}

export interface GoalRevision {
  date: string;
  /** true si la modification rend l'objectif plus agressif (plus vite ou plus bas). */
  moreAggressive: boolean;
}

export interface BehaviorLog {
  days: BehaviorDay[];
  goalRevisions?: GoalRevision[];
  /** Date du jour "YYYY-MM-DD" — fournie par l'appelant, jamais lue de l'horloge. */
  today: string;
}

const cfg = SAFETY_CONFIG.behavior;

function shiftDate(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/* --------------------- Motif 1 : jamais de repos ------------------- */

function detectNoRest(byDate: Map<string, BehaviorDay>, today: string): SafetyIntervention | null {
  // Un jour sans donnée interrompt la série (prudence : on ne suppose
  // jamais qu'un jour non renseigné était un jour d'entraînement).
  let cursor = byDate.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (true) {
    const day = byDate.get(cursor);
    if (!day || !day.trainedToday || day.restDayTaken) break;
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  if (streak < cfg.noRestConsecutiveDays) return null;

  return {
    id: "bw-sans-repos",
    kind: "sans_repos",
    severity: "warning",
    title: "Ton corps réclame une pause",
    message:
      `Cela fait ${streak} jours d'affilée que tu t'entraînes, et c'est le signe d'une belle motivation. Physiologiquement, le muscle ne se construit pas pendant la séance : il se répare et se renforce pendant la récupération. Sans pause, la fatigue s'accumule plus vite que l'adaptation et le risque de blessure augmente. Une journée de repos maintenant te fera progresser plus que la séance de demain — et dans SaneFit, elle rapporte autant de points.`,
    proposalLabel: "Programmer un jour de repos",
  };
}

/* ------------------ Motif 2 : chute des apports -------------------- */

function detectIntakeDrop(
  byDate: Map<string, BehaviorDay>,
  today: string,
): SafetyIntervention | null {
  const collect = (from: number, to: number): number[] => {
    const values: number[] = [];
    for (let i = from; i <= to; i++) {
      const day = byDate.get(shiftDate(today, -i));
      if (day && day.caloriesLogged !== null) values.push(day.caloriesLogged);
    }
    return values;
  };

  const recent = collect(0, cfg.intakeDropRecentDays - 1);
  const baseline = collect(
    cfg.intakeDropRecentDays,
    cfg.intakeDropRecentDays + cfg.intakeDropBaselineDays - 1,
  );
  if (recent.length < cfg.intakeDropMinRecentDays) return null;
  if (baseline.length < cfg.intakeDropMinBaselineDays) return null;

  const baselineMean = mean(baseline);
  if (baselineMean <= 0) return null;
  const ratio = mean(recent) / baselineMean;
  if (ratio >= cfg.intakeDropRatio) return null;

  const dropPct = Math.round((1 - ratio) * 100);
  return {
    id: "bw-chute-apports",
    kind: "chute_apports",
    severity: "warning",
    title: "Tes apports ont nettement baissé",
    message:
      `Sur les ${cfg.intakeDropRecentDays} derniers jours, tes apports renseignés sont environ ${dropPct} % en dessous de ta moyenne habituelle. Si c'est un oubli de saisie, tout va bien. Si tu manges réellement moins, sache qu'un manque d'énergie prolongé pousse le corps à ralentir son métabolisme et à puiser dans le muscle — l'inverse de ce que tu construis. Manger assez fait partie du plan, pas de l'écart.`,
    proposalLabel: null,
  };
}

/* ----------- Motif 3 : objectif resserré à répétition -------------- */

function detectGoalTightening(
  revisions: GoalRevision[],
  today: string,
): SafetyIntervention | null {
  const windowStart = shiftDate(today, -(cfg.goalTighteningWindowDays - 1));
  const count = revisions.filter((r) => r.moreAggressive && r.date >= windowStart && r.date <= today).length;
  if (count < cfg.goalTighteningCount) return null;

  return {
    id: "bw-objectif-agressif",
    kind: "objectif_agressif",
    severity: "info",
    title: "L'impatience est normale, la physiologie a son rythme",
    message:
      `Tu as rendu ton objectif plus exigeant ${count} fois en ${cfg.goalTighteningWindowDays} jours. C'est une impatience très fréquente — et physiologiquement, accélérer n'accélère pas le résultat : un déficit plus dur augmente la part de muscle perdue et le ralentissement métabolique, ce qui prépare le rebond. Ton plan initial était calibré pour durer ; les plateaux de quelques semaines font partie du processus normal.`,
    proposalLabel: null,
  };
}

/* -------------------------- Point d'entrée ------------------------- */

export function detectBehaviorSignals(log: BehaviorLog): SafetyIntervention[] {
  const byDate = new Map(log.days.map((d) => [d.date, d]));
  const signals = [
    detectNoRest(byDate, log.today),
    detectIntakeDrop(byDate, log.today),
    detectGoalTightening(log.goalRevisions ?? [], log.today),
  ];
  return signals.filter((s): s is SafetyIntervention => s !== null);
}

/* ------------- Adaptateur depuis le journal gamification ----------- */

/**
 * Construit le journal comportemental à partir de l'état de
 * gamification. Les kcal quotidiennes n'y sont pas encore
 * journalisées : le motif « chute des apports » restera silencieux
 * tant que cet historique n'existe pas.
 */
export function behaviorDaysFromGamification(state: GamificationState): BehaviorDay[] {
  return Object.entries(state.days).map(([date, day]) => ({
    date,
    trainedToday: (day.actions["seance_terminee"] ?? 0) > 0,
    restDayTaken: (day.actions["jour_de_repos"] ?? 0) > 0,
    caloriesLogged: null,
  }));
}
