import {
  ACTIVE_DAYS_TARGET,
  BADGES,
  GAMIFICATION_RULES,
  JOKERS_PER_MONTH,
  LEVELS,
  type LessonDefinition,
  type LevelDefinition,
} from "./rules";
import type {
  DailyActivity,
  DayRecord,
  GamificationState,
  WeekRecord,
} from "./types";

/* ------------------------------------------------------------------ */
/* Moteur de gamification — pur et sans horloge : toutes les dates    */
/* viennent des données d'entrée, jamais de Date.now().               */
/*                                                                    */
/* Il applique la charte de rules.ts avec deux invariants :           */
/*   - effet cliquet : une validation accordée n'est jamais reprise,  */
/*     même si la donnée du jour est corrigée à la baisse ;           */
/*   - aucune perte : XP, badges et compteurs ne diminuent jamais.    */
/* Une semaine sans aucune donnée n'est jamais évaluée : ni sanction, */
/* ni joker consommé.                                                 */
/* ------------------------------------------------------------------ */

export function createInitialState(): GamificationState {
  return {
    version: 1,
    xpTotal: 0,
    days: {},
    weeks: {},
    jokersMonth: "",
    jokersRemaining: JOKERS_PER_MONTH,
    badges: {},
    lastClosedWeekOutcome: null,
    counters: {
      mealsLogged: 0,
      sleepNights7h: 0,
      hydrationDays: 0,
      restWeekChain: 0,
      weeksSucceeded: 0,
      comebackWeeks: 0,
      lessonsRead: 0,
    },
  };
}

/* ----------------------- Calendrier ISO --------------------------- */

/** Clé de semaine ISO 8601, ex. "2026-W30". */
export function isoWeekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  // On se place sur le jeudi de la semaine : il détermine l'année ISO.
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const year = d.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - jan1) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function mondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/* -------------------- Jokers (recharge mensuelle) ------------------ */

/** Recharge les jokers si `monthKey` ("YYYY-MM") est un nouveau mois — sans cumul. */
function ensureJokerMonth(state: GamificationState, monthKey: string) {
  if (monthKey > state.jokersMonth) {
    state.jokersMonth = monthKey;
    state.jokersRemaining = JOKERS_PER_MONTH;
  }
}

/* --------------------- Clôture des semaines ----------------------- */

function closeWeek(state: GamificationState, week: WeekRecord) {
  // Les jokers consommés sont ceux du mois du lundi de la semaine close.
  ensureJokerMonth(state, week.mondayDate.slice(0, 7));

  if (week.activeDays >= ACTIVE_DAYS_TARGET) {
    week.outcome = "reussie";
  } else if (state.jokersRemaining > 0) {
    state.jokersRemaining -= 1;
    week.outcome = "joker";
  } else {
    // Semaine manquée : rien n'est retiré, elle n'a simplement rien rapporté.
    week.outcome = "manquee";
  }

  if (week.outcome !== "manquee") {
    state.counters.weeksSucceeded += 1;
    if (state.lastClosedWeekOutcome === "manquee") state.counters.comebackWeeks += 1;
  }
  // Chaîne de récupération : avance avec un jour de repos, se FIGE sinon.
  if (week.restDays > 0) state.counters.restWeekChain += 1;

  state.lastClosedWeekOutcome = week.outcome;
}

/** Clôture toutes les semaines encore "en_cours" antérieures à `currentWeekKey`. */
function finalizeWeeksBefore(state: GamificationState, currentWeekKey: string) {
  for (const key of Object.keys(state.weeks).sort()) {
    if (key >= currentWeekKey) break;
    const week = state.weeks[key];
    if (week.outcome === "en_cours") closeWeek(state, week);
  }
}

/* -------------------------- Badges -------------------------------- */

function grantBadges(state: GamificationState, date: string) {
  for (const badge of BADGES) {
    if (!state.badges[badge.id] && badge.earned(state)) {
      state.badges[badge.id] = date;
    }
  }
}

/* --------------------- Enregistrement d'un jour -------------------- */

/**
 * Intègre l'instantané d'une journée et renvoie le nouvel état.
 * Idempotent : re-signaler la même journée met à jour à la hausse
 * (effet cliquet), jamais à la baisse. Enregistrer un jour d'une
 * nouvelle semaine clôture automatiquement les semaines passées.
 * Un jour ajouté après clôture de sa semaine rapporte ses points,
 * mais ne rouvre pas l'issue de la semaine.
 */
export function recordDay(state: GamificationState, activity: DailyActivity): GamificationState {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activity.date)) return state;

  const s = structuredClone(state);
  const weekKey = isoWeekKey(activity.date);
  finalizeWeeksBefore(s, weekKey);
  ensureJokerMonth(s, activity.date.slice(0, 7));

  const day: DayRecord =
    s.days[activity.date] ?? { actions: {}, xp: 0, active: false, lessonsRead: 0 };
  const week: WeekRecord =
    s.weeks[weekKey] ?? {
      key: weekKey,
      mondayDate: mondayOf(activity.date),
      activeDays: 0,
      restDays: 0,
      outcome: "en_cours",
    };

  for (const rule of GAMIFICATION_RULES) {
    const previous = day.actions[rule.id] ?? 0;
    const triggered = Math.max(0, Math.floor(rule.trigger(activity)));
    const next = Math.max(previous, Math.min(rule.maxPerDay, triggered));
    if (next === previous) continue;

    const delta = next - previous;
    day.actions[rule.id] = next;
    day.xp += delta * rule.points;
    s.xpTotal += delta * rule.points;

    if (rule.id === "repas_renseigne") s.counters.mealsLogged += delta;
    if (rule.id === "sommeil_7h") s.counters.sleepNights7h += delta;
    if (rule.id === "hydratation") s.counters.hydrationDays += delta;
    if (rule.id === "jour_de_repos") week.restDays += delta;
  }

  if (!day.active && day.xp > 0) {
    day.active = true;
    week.activeDays += 1;
  }

  const lessons = Math.max(day.lessonsRead, Math.max(0, Math.floor(activity.lessonsRead)));
  s.counters.lessonsRead += lessons - day.lessonsRead;
  day.lessonsRead = lessons;

  s.days[activity.date] = day;
  s.weeks[weekKey] = week;
  grantBadges(s, activity.date);
  return s;
}

/* ---------------------- Lectures pour la UI ------------------------ */

export interface WeekProgress {
  weekKey: string;
  activeDays: number;
  targetDays: number;
  outcome: WeekRecord["outcome"];
  jokersRemaining: number;
}

/** Score de régularité de la semaine contenant `date`. */
export function getWeekProgress(state: GamificationState, date: string): WeekProgress {
  const weekKey = isoWeekKey(date);
  const week = state.weeks[weekKey];
  return {
    weekKey,
    activeDays: week?.activeDays ?? 0,
    targetDays: ACTIVE_DAYS_TARGET,
    outcome: week?.outcome ?? "en_cours",
    jokersRemaining: state.jokersRemaining,
  };
}

/** Niveau atteint pour un total d'XP (le premier niveau est acquis d'office). */
export function getLevel(xp: number): LevelDefinition {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  return current;
}

/** Prochain niveau à atteindre, ou null si le dernier est acquis. */
export function getNextLevel(xp: number): LevelDefinition | null {
  return LEVELS.find((level) => level.minXp > xp) ?? null;
}

/** Toutes les leçons du Dr Sane débloquées à ce total d'XP. */
export function getUnlockedLessons(xp: number): LessonDefinition[] {
  return LEVELS.filter((level) => xp >= level.minXp).flatMap((level) => level.lessons);
}
