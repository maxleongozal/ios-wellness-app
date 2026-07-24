import { DOCTOR_MESSAGES, type DoctorTone } from "@/content/doctor-messages";
import { isoWeekKey } from "@/lib/gamification";
import { SITUATIONS } from "./situations";
import type {
  DoctorIntervention,
  InterventionContext,
  InterventionHistory,
} from "./types";

/* ------------------------------------------------------------------ */
/* Moteur d'interventions du Dr Sane. Pur et sans horloge : le        */
/* contexte et l'historique sont fournis en entrée.                   */
/*                                                                    */
/* Arbitrage :                                                        */
/*   - une seule intervention à la fois, la plus prioritaire          */
/*     (alerte douce > félicitation > information — les alertes de    */
/*     SÉCURITÉ ne passent pas par ce moteur et ne sont jamais        */
/*     plafonnées, voir doctor-engine.getDoctorSafetyAlert) ;         */
/*   - plafond de fréquence : 2 interventions distinctes par jour     */
/*     maximum, et jamais deux fois le même message dans une même     */
/*     semaine ISO. Une app qui parle trop est désinstallée.          */
/*   - une intervention déjà affichée aujourd'hui reste affichable    */
/*     toute la journée (stabilité : pas de message qui clignote).    */
/* ------------------------------------------------------------------ */

export const MAX_INTERVENTIONS_PER_DAY = 2;
/** Fenêtre de rétention de l'historique — couvre le plafond hebdomadaire. */
const HISTORY_RETENTION_DAYS = 14;

const TONE_PRIORITY: Record<DoctorTone, number> = {
  alerte: 0,
  felicitation: 1,
  information: 2,
};

export function createEmptyHistory(): InterventionHistory {
  return { version: 1, shown: [], celebratedMilestones: [] };
}

const interpolate = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (raw, key: string) =>
    key in vars ? String(vars[key]) : raw,
  );

/**
 * Évalue le contexte et renvoie l'unique intervention à afficher,
 * ou null si rien n'est pertinent ou que le quota du jour est atteint.
 * L'appelant doit enregistrer l'affichage via `recordShown`.
 */
export function selectIntervention(
  ctx: InterventionContext,
  history: InterventionHistory,
): DoctorIntervention | null {
  const weekKey = isoWeekKey(ctx.today);
  const shownToday = new Set(
    history.shown.filter((e) => e.date === ctx.today).map((e) => e.id),
  );
  // Le plafond hebdomadaire exclut aujourd'hui : re-proposer le message
  // du jour n'est pas une répétition, c'est le même affichage qui dure.
  const shownThisWeek = new Set(
    history.shown
      .filter((e) => e.date !== ctx.today && isoWeekKey(e.date) === weekKey)
      .map((e) => e.id),
  );
  const dailyCapReached = shownToday.size >= MAX_INTERVENTIONS_PER_DAY;

  const candidates = SITUATIONS.flatMap((rule) => {
    const match = rule.detect(ctx);
    if (!match) return [];
    if (
      match.milestone &&
      history.celebratedMilestones.includes(`${rule.id}:${match.milestone}`)
    ) {
      return [];
    }
    if (shownThisWeek.has(rule.id)) return [];
    if (dailyCapReached && !shownToday.has(rule.id)) return [];
    return [{ rule, match }];
  });
  if (candidates.length === 0) return null;

  const best = candidates.reduce((a, b) =>
    TONE_PRIORITY[DOCTOR_MESSAGES[b.rule.id].tone] <
    TONE_PRIORITY[DOCTOR_MESSAGES[a.rule.id].tone]
      ? b
      : a,
  );

  const def = DOCTOR_MESSAGES[best.rule.id];
  return {
    id: best.rule.id,
    tone: def.tone,
    message: interpolate(def.message, best.match.vars),
    cta:
      def.ctaLabel && def.ctaScreen
        ? { label: def.ctaLabel, screen: def.ctaScreen }
        : null,
    ...(best.match.milestone ? { milestone: best.match.milestone } : {}),
  };
}

/**
 * Enregistre l'affichage d'une intervention : alimente les plafonds de
 * fréquence et fige le palier célébré. Idempotent pour une même journée,
 * et élague l'historique au-delà de la fenêtre de rétention.
 */
export function recordShown(
  history: InterventionHistory,
  intervention: DoctorIntervention,
  today: string,
): InterventionHistory {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - HISTORY_RETENTION_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const shown = history.shown.filter((e) => e.date >= cutoffStr);
  if (!shown.some((e) => e.id === intervention.id && e.date === today)) {
    shown.push({ id: intervention.id, date: today });
  }

  const milestoneKey = intervention.milestone
    ? `${intervention.id}:${intervention.milestone}`
    : null;
  const celebratedMilestones =
    milestoneKey && !history.celebratedMilestones.includes(milestoneKey)
      ? [...history.celebratedMilestones, milestoneKey]
      : history.celebratedMilestones;

  return { version: 1, shown, celebratedMilestones };
}
