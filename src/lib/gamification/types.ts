/* ------------------------------------------------------------------ */
/* Types du module de gamification.                                   */
/*                                                                    */
/* IMPORTANT : `DailyActivity` est l'UNIQUE entrée du moteur de       */
/* points. Elle ne contient volontairement AUCUN champ corporel :     */
/* pas de poids, pas de mensuration, pas de calories, pas de durée    */
/* d'entraînement. Une règle qui voudrait récompenser un résultat     */
/* corporel serait donc impossible à écrire sans élargir ce type —    */
/* ne l'élargissez pas. Voir la charte en tête de rules.ts.           */
/* ------------------------------------------------------------------ */

/** Instantané des comportements d'une journée, rapporté par l'app. */
export interface DailyActivity {
  /** Date locale "YYYY-MM-DD". */
  date: string;
  /** Nombre de repas renseignés dans le journal ce jour. */
  mealsLogged: number;
  /** Cible de protéines atteinte (calculée en amont par le moteur métabolique). */
  proteinTargetMet: boolean;
  /** Heures de sommeil renseignées, null si non renseigné. */
  sleepHours: number | null;
  /** La séance PLANIFIÉE du jour a été terminée (une seule compte). */
  plannedWorkoutDone: boolean;
  /** Le programme prévoyait un jour de repos aujourd'hui. */
  plannedRestDay: boolean;
  /** Cible d'hydratation du jour atteinte. */
  waterTargetMet: boolean;
  /** Leçons du Dr Sane lues ce jour (alimente les badges "connaissance"). */
  lessonsRead: number;
}

export type WeekOutcome = "en_cours" | "reussie" | "joker" | "manquee";

export interface DayRecord {
  /** Validations par règle (ruleId -> nombre), plafonnées et jamais reprises. */
  actions: Record<string, number>;
  xp: number;
  /** true dès qu'au moins une action est validée ce jour-là. */
  active: boolean;
  /** Leçons lues ce jour (effet cliquet, comme les actions). */
  lessonsRead: number;
}

export interface WeekRecord {
  /** Clé de semaine ISO, ex. "2026-W30". */
  key: string;
  /** Lundi de la semaine, "YYYY-MM-DD" — sert à rattacher les jokers au bon mois. */
  mondayDate: string;
  activeDays: number;
  /** Jours de repos respectés cette semaine (pour la chaîne de récupération). */
  restDays: number;
  outcome: WeekOutcome;
}

/** Cumuls à vie : ils ne peuvent que croître, jamais diminuer. */
export interface LifetimeCounters {
  mealsLogged: number;
  sleepNights7h: number;
  hydrationDays: number;
  /** Semaines avec ≥ 1 jour de repos respecté. Se FIGE (jamais remis à zéro)
   *  quand une semaine passe sans repos — choix produit assumé. */
  restWeekChain: number;
  /** Semaines réussies ou absorbées par un joker. */
  weeksSucceeded: number;
  /** Semaines réussies juste après une semaine manquée (badge "Retour gagnant"). */
  comebackWeeks: number;
  lessonsRead: number;
}

export interface GamificationState {
  version: 1;
  /** XP total — ne peut que croître. */
  xpTotal: number;
  /** Journal par date "YYYY-MM-DD". */
  days: Record<string, DayRecord>;
  /** Semaines par clé ISO "YYYY-Www". */
  weeks: Record<string, WeekRecord>;
  /** Mois "YYYY-MM" du dernier rechargement des jokers. */
  jokersMonth: string;
  jokersRemaining: number;
  /** badgeId -> date d'obtention. Un badge n'est jamais retiré. */
  badges: Record<string, string>;
  /** Issue de la dernière semaine clôturée (pour "Retour gagnant"). */
  lastClosedWeekOutcome: Exclude<WeekOutcome, "en_cours"> | null;
  counters: LifetimeCounters;
}
