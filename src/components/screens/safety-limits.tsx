"use client";

import { BookOpen, ShieldCheck, Stethoscope, X } from "lucide-react";
import type { UserConfig } from "@/types";
import { computeMetabolics } from "@/lib/metabolic-engine";
import {
  MEDICAL_DISCLAIMER,
  SAFETY_CONFIG,
  SAFETY_SOURCES,
  bmiFloorKgFor,
  gainMaxKgPerWeekFor,
  lossMaxKgPerWeekFor,
} from "@/lib/safety";

/* ------------------------------------------------------------------ */
/* « Mes limites de sécurité » : l'utilisateur consulte les seuils    */
/* qui s'appliquent à SON profil et comprend d'où ils viennent.       */
/* Aucune valeur en dur : tout est calculé depuis safety/config.ts.   */
/* ------------------------------------------------------------------ */

const fr = (v: number) => v.toLocaleString("fr-FR");

function LimitRow({
  label,
  value,
  origin,
}: {
  label: string;
  value: string;
  origin: string;
}) {
  return (
    <div className="bg-white/60 rounded-xl px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12.5px] font-bold text-[var(--color-ink)]">{label}</p>
        <p className="text-[13px] font-extrabold text-[var(--color-forest)] tabular-nums text-right shrink-0">
          {value}
        </p>
      </div>
      <p className="text-[10.5px] text-[var(--color-muted)] leading-snug mt-0.5">{origin}</p>
    </div>
  );
}

export function SafetyLimitsSheet({
  config,
  onClose,
}: {
  config: UserConfig;
  onClose: () => void;
}) {
  const m = computeMetabolics(config);
  const { pace, calories, body, behavior } = SAFETY_CONFIG;
  const lossMax = Math.round(lossMaxKgPerWeekFor(config.weightKg) * 100) / 100;
  const gainMax = Math.round(gainMaxKgPerWeekFor(config.weightKg) * 100) / 100;
  const isMinor = config.age < body.adultAge;
  const deficitPct = Math.round(
    (config.restrictiveDietHistory ? calories.deficitRestrictiveHistoryPct : calories.deficitMaxPct) * 100,
  );

  return (
    <div className="absolute inset-0 z-50">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-label="Mes limites de sécurité"
        className="animate-sheet-up absolute bottom-0 left-0 right-0 bg-[var(--color-cream)] rounded-t-[28px] max-h-[85%] flex flex-col"
      >
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="w-9 h-1.5 rounded-full bg-black/15" />
        </div>
        <div className="px-5 pb-2 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[var(--color-forest)]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[var(--color-forest)]" strokeWidth={2.4} />
            </span>
            <div>
              <h3 className="text-[17px] font-extrabold text-[var(--color-forest-deep)] leading-tight">
                Mes limites de sécurité
              </h3>
              <p className="text-[10.5px] text-[var(--color-muted)] font-semibold">
                Calculées pour ton profil — non négociables par l&apos;app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'écran des limites"
            className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center text-[var(--color-ink)] shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.6} />
          </button>
        </div>

        <div className="px-5 pb-8 pt-1 space-y-4 overflow-y-auto">
          {/* Mention médicale — en tête, pas en petits caractères. */}
          <div className="flex items-start gap-2.5 bg-white rounded-2xl border-2 border-[var(--color-forest)]/15 p-3.5">
            <Stethoscope className="w-4.5 h-4.5 w-[18px] h-[18px] text-[var(--color-forest)] shrink-0 mt-0.5" strokeWidth={2.2} />
            <p className="text-[11.5px] text-[var(--color-ink-soft)] leading-relaxed">
              {MEDICAL_DISCLAIMER}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-forest)]">
              Tes seuils personnalisés
            </p>
            <div className="mt-2 space-y-2">
              <LimitRow
                label="Perte de poids maximale"
                value={`${fr(lossMax)} kg / sem`}
                origin={`${fr(pace.lossMaxPctPerWeek)} % de ton poids, plafonné à ${fr(pace.lossMaxKgPerWeek)} kg — CDC · ISSN.`}
              />
              <LimitRow
                label="Prise de poids maximale"
                value={`${fr(gainMax)} kg / sem`}
                origin={`${fr(pace.gainMaxPctPerWeek)} % de ton poids par semaine — au-delà, l'excédent est stocké en graisse (Iraki et al. 2019).`}
              />
              <LimitRow
                label="Plancher calorique"
                value={`${m.calorieFloor} kcal / j`}
                origin={`Jamais sous ton métabolisme de base (${m.mb} kcal) ni sous ${calories.absoluteFloorKcal[config.biologie]} kcal — repère NIH/NHLBI + garde-fou SaneFit.`}
              />
              <LimitRow
                label="Poids plancher"
                value={`${fr(bmiFloorKgFor(config.heightCm))} kg`}
                origin={`IMC ${fr(body.bmiFloor)} pour ta taille (${config.heightCm} cm) — seuil d'insuffisance pondérale de l'OMS. Aucun objectif en dessous.`}
              />
              <LimitRow
                label="Déficit calorique maximal"
                value={isMinor ? "0 %" : `${deficitPct} % du TDEE`}
                origin={
                  isMinor
                    ? `Avant ${body.adultAge} ans, SaneFit ne programme aucun déficit : les repères adultes ne s'appliquent pas à un corps en croissance.`
                    : config.restrictiveDietHistory
                      ? "Borne douce activée par ton historique de régimes restrictifs — repère SaneFit."
                      : "Cohérent avec le déficit de 500-1000 kcal/j du CDC."
                }
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-forest)]">
              Veille bienveillante
            </p>
            <p className="text-[10.5px] text-[var(--color-muted)] leading-snug mt-1">
              Ces repères déclenchent une explication du Dr Sane — jamais un blocage.
              Ce sont des choix prudents de SaneFit, sans chiffre officiel dans la littérature.
            </p>
            <div className="mt-2 space-y-2">
              <LimitRow
                label="Entraînement sans repos"
                value={`${behavior.noRestConsecutiveDays} jours`}
                origin="Le muscle se construit pendant la récupération (ACSM : ≥ 48 h par groupe musculaire) — la fenêtre exacte est un repère SaneFit."
              />
              <LimitRow
                label="Chute des apports renseignés"
                value={`− ${Math.round((1 - behavior.intakeDropRatio) * 100)} %`}
                origin={`Moyenne des ${behavior.intakeDropRecentDays} derniers jours comparée aux ${behavior.intakeDropBaselineDays} précédents — repère SaneFit.`}
              />
              <LimitRow
                label="Objectif resserré à répétition"
                value={`${behavior.goalTighteningCount} fois / ${behavior.goalTighteningWindowDays} j`}
                origin="Accélérer n'accélère pas le résultat : un déficit plus dur se paie en muscle — repère SaneFit."
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-forest)] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2.4} />
              D&apos;où viennent ces seuils
            </p>
            <div className="mt-2 space-y-2">
              {SAFETY_SOURCES.map((s) => (
                <div key={s.id} className="bg-white/60 rounded-xl px-3.5 py-3">
                  <p className="text-[11.5px] font-bold text-[var(--color-ink)]">{s.label}</p>
                  <p className="text-[10.5px] text-[var(--color-muted)] leading-snug mt-0.5">
                    {s.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
