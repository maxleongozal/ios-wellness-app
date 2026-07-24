"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlarmClock,
  Armchair,
  BedDouble,
  Bike,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  HelpCircle,
  History,
  Leaf,
  Minus,
  Moon,
  PieChart,
  Plus,
  Salad,
  ShieldCheck,
  ThumbsDown,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import type {
  ActivityLevel,
  Biologie,
  Objectif,
  OnboardingAnswers,
  SleepRange,
  SupplementId,
  UserConfig,
} from "@/types";
import { SUPPLEMENTS, getSupplement } from "@/lib/supplements";
import {
  AGE_MAX,
  AGE_MIN,
  HEIGHT_MAX,
  HEIGHT_MIN,
  WEIGHT_MAX,
  WEIGHT_MIN,
  buildUserConfig,
  getWorkoutPlan,
  isGoalWeightRealistic,
} from "@/lib/user-config";
import { computeMetabolics, describeAdjustment } from "@/lib/metabolic-engine";
import {
  HEALTHY_LOSS_KG_PER_WEEK,
  MAX_LOSS_KG_PER_WEEK,
  PLAN_WEEKS_MAX,
  PLAN_WEEKS_MIN,
  assessGoalPace,
} from "@/lib/health-guardian";
import { getCalorieEducation, getSupplementEducation } from "@/lib/doctor-engine";
import { DoctorAvatar } from "@/components/doctor-avatar";
import { cn } from "@/lib/utils";

type Step =
  | "welcome"
  | "name"
  | "objectif"
  | "biologie"
  | "corps"
  | "poids_cible"
  | "delai"
  | "activite"
  | "sommeil"
  | "regimes"
  | "supplements"
  | "recap";

function buildSteps(includeDelai: boolean): Step[] {
  const steps: Step[] = ["welcome", "name", "objectif", "biologie", "corps", "poids_cible"];
  // La durée du plan n'a de sens que si le poids doit changer.
  if (includeDelai) steps.push("delai");
  steps.push("activite", "sommeil", "regimes", "supplements", "recap");
  return steps;
}

interface OnboardingFlowProps {
  onComplete: (config: UserConfig) => void;
}

/* ------------------------- Briques UI ------------------------- */

function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all",
        "bg-[var(--color-forest)] hover:bg-[var(--color-forest-dark)] active:scale-[0.98]",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {label}
    </button>
  );
}

function OptionCard({
  selected,
  onSelect,
  icon,
  label,
  sublabel,
  tall,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  tall?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative w-full bg-white rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98]",
        tall && "py-7 flex flex-col items-center text-center",
        selected
          ? "border-[#34C759] shadow-[0_6px_18px_-8px_rgba(52,199,89,0.5)]"
          : "border-black/[0.06] hover:border-black/15",
      )}
    >
      {selected ? (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#34C759] flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
        </span>
      ) : null}
      <span
        className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center",
          tall ? "mb-3" : "mb-2.5",
          selected ? "bg-[#34C759]/12 text-[#249144]" : "bg-[var(--color-forest)]/8 text-[var(--color-forest)]",
        )}
      >
        {icon}
      </span>
      <span className="block text-[14px] font-bold text-[var(--color-ink)]">{label}</span>
      {sublabel ? (
        <span className="block text-[11px] text-[var(--color-muted)] mt-0.5 leading-snug">
          {sublabel}
        </span>
      ) : null}
    </button>
  );
}

function SliderField({
  label,
  unit,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="bg-white rounded-2xl border-2 border-black/[0.06] p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-[var(--color-ink)]">{label}</span>
        <span className="text-[24px] font-extrabold text-[var(--color-forest-deep)] tabular-nums">
          {format ? format(value) : value}
          <span className="text-[13px] font-semibold text-[var(--color-muted)]"> {unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="ios-slider mt-4"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-[var(--color-muted)]">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

function AgeStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const bump = (delta: number) => onChange(Math.min(AGE_MAX, Math.max(AGE_MIN, value + delta)));
  return (
    <div className="bg-white rounded-2xl border-2 border-black/[0.06] p-4">
      <span className="text-[13px] font-bold text-[var(--color-ink)]">Âge</span>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => bump(-1)}
          aria-label="Diminuer l'âge"
          disabled={value <= AGE_MIN}
          className="w-14 h-14 rounded-full bg-[var(--color-forest)]/8 text-[var(--color-forest)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
        >
          <Minus className="w-6 h-6" strokeWidth={2.6} />
        </button>
        <span className="text-[36px] font-extrabold text-[var(--color-forest-deep)] tabular-nums">
          {value}
          <span className="text-[14px] font-semibold text-[var(--color-muted)]"> ans</span>
        </span>
        <button
          type="button"
          onClick={() => bump(1)}
          aria-label="Augmenter l'âge"
          disabled={value >= AGE_MAX}
          className="w-14 h-14 rounded-full bg-[var(--color-forest)]/8 text-[var(--color-forest)] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
        >
          <Plus className="w-6 h-6" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className="text-[26px] font-extrabold text-[var(--color-forest-deep)] leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-[13px] text-[var(--color-ink-soft)] mt-2 leading-relaxed">{subtitle}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </>
  );
}

/* ------------------------- Flow principal ------------------------- */

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [showGuardian, setShowGuardian] = useState(false);
  const [infoSupplement, setInfoSupplement] = useState<SupplementId | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    userName: "",
    biologie: null,
    objectif: null,
    acceptedSupplements: null,
    age: 25,
    heightCm: 170,
    weightKg: 70,
    weightGoalKg: null,
    targetWeeks: null,
    activityLevel: null,
    sleep: null,
    restrictiveDietHistory: null,
  });

  const toggleSupplement = (id: SupplementId) =>
    setAnswers((a) => {
      const current = a.acceptedSupplements ?? [];
      return {
        ...a,
        acceptedSupplements: current.includes(id)
          ? current.filter((s) => s !== id)
          : [...current, id],
      };
    });

  // Poids cible : pré-rempli avec le poids actuel, validé en temps réel.
  const goalKg = answers.weightGoalKg ?? answers.weightKg;
  const goalDeltaKg = Math.round((goalKg - answers.weightKg) * 10) / 10;
  const goalRealistic = isGoalWeightRealistic(answers.weightKg, goalKg);

  const steps = useMemo(() => buildSteps(Math.abs(goalDeltaKg) >= 0.5), [goalDeltaKg]);
  const questionSteps: Step[] = steps.filter((s) => s !== "welcome" && s !== "recap");
  const stepIndex = steps.indexOf(step);
  const questionIndex = questionSteps.indexOf(step);
  const progress =
    step === "welcome" ? 0 : step === "recap" ? 1 : (questionIndex + 1) / questionSteps.length;

  const config = useMemo(
    () => (step === "recap" ? buildUserConfig(answers) : null),
    [step, answers],
  );

  // Gardien de Santé : durée du plan et rythme induit.
  const defaultWeeks = assessGoalPace(answers.weightKg, goalKg, 1).recommendedWeeks;
  const weeksValue = answers.targetWeeks ?? defaultWeeks;
  const pace = assessGoalPace(answers.weightKg, goalKg, weeksValue);

  const next = () => {
    // Interception : une perte > 1 kg/semaine déclenche l'écran du Gardien.
    if (step === "delai" && pace.dangerous) {
      setShowGuardian(true);
      return;
    }
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  };
  const back = () => setStep(steps[Math.max(stepIndex - 1, 0)]);

  const acceptGuardianAdjustment = () => {
    setAnswers((a) => ({ ...a, targetWeeks: pace.recommendedWeeks }));
    setShowGuardian(false);
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)]);
  };
  const goalMismatch =
    goalRealistic &&
    ((answers.objectif === "perte_poids" && goalDeltaKg > 0) ||
      (answers.objectif === "prise_masse" && goalDeltaKg < 0));

  const canContinue =
    (step === "name" && answers.userName.trim().length > 0) ||
    (step === "objectif" && answers.objectif !== null) ||
    (step === "biologie" && answers.biologie !== null) ||
    step === "corps" ||
    step === "delai" ||
    (step === "poids_cible" && goalRealistic) ||
    (step === "activite" && answers.activityLevel !== null) ||
    (step === "sommeil" && answers.sleep !== null) ||
    (step === "regimes" && answers.restrictiveDietHistory !== null) ||
    (step === "supplements" && answers.acceptedSupplements !== null);

  // Écran d'alerte bienveillant du Gardien de Santé — remplace tout le contenu.
  if (showGuardian) {
    return (
      <div className="absolute inset-0 pt-9 flex flex-col bg-[var(--color-cream)]">
        <div className="animate-fade-in flex-1 flex flex-col items-center justify-center text-center px-7">
          <div className="w-20 h-20 rounded-full bg-[var(--color-warn-bg)] border-2 border-[var(--color-warn-border)] flex items-center justify-center">
            <HeartPulse className="w-10 h-10 text-[var(--color-warn)]" strokeWidth={2.2} />
          </div>
          <h2 className="mt-6 text-[24px] font-extrabold text-[var(--color-forest-deep)] leading-tight tracking-tight">
            Ralentissons un peu
          </h2>
          <p className="mt-3 text-[13.5px] text-[var(--color-ink-soft)] leading-relaxed">
            Attention : une perte de poids trop rapide nuit à ta santé, ton métabolisme
            et tes muscles.
          </p>
          <div className="mt-5 w-full bg-white rounded-2xl border-2 border-black/[0.06] p-4 text-left space-y-2">
            <div className="flex justify-between text-[12.5px]">
              <span className="text-[var(--color-ink-soft)]">Ton plan actuel</span>
              <span className="font-bold text-[var(--color-warn)] tabular-nums">
                {Math.abs(goalDeltaKg).toLocaleString("fr-FR")} kg en {weeksValue} sem ·{" "}
                {pace.ratePerWeek.toLocaleString("fr-FR")} kg/sem
              </span>
            </div>
            <div className="flex justify-between text-[12.5px]">
              <span className="text-[var(--color-ink-soft)]">Rythme sain</span>
              <span className="font-bold text-[var(--color-forest)]">
                {MAX_LOSS_KG_PER_WEEK} kg/sem maximum
              </span>
            </div>
          </div>
          <DoctorAvatar
            active
            className="mt-5 w-full text-left"
            message={`En tant que médecin, je te déconseille de dépasser ${MAX_LOSS_KG_PER_WEEK} kg par semaine : au-delà, ton corps puise dans le muscle et ton métabolisme ralentit. Ajustons ton délai ensemble, ton objectif reste le même.`}
          />
        </div>
        <div className="px-6 pb-9 pt-2 space-y-2.5">
          <PrimaryButton
            label={`Ajuster à ${pace.recommendedWeeks} semaines (≈ ${HEALTHY_LOSS_KG_PER_WEEK.toLocaleString("fr-FR")} kg/sem)`}
            onClick={acceptGuardianAdjustment}
          />
          <button
            type="button"
            onClick={() => setShowGuardian(false)}
            className="w-full py-3 rounded-2xl text-[13px] font-bold text-[var(--color-forest)] hover:bg-[var(--color-forest)]/5 transition-colors"
          >
            Je revois ma durée moi-même
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pt-9 flex flex-col bg-[var(--color-cream)]">
      {/* Header : retour + barre de progression */}
      {step !== "welcome" && step !== "recap" ? (
        <div className="px-5 pt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={back}
            aria-label="Revenir en arrière"
            className="w-9 h-9 rounded-full bg-white/80 border border-black/[0.06] flex items-center justify-center text-[var(--color-ink)] hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <div className="flex-1 h-2 rounded-full bg-black/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#34C759] transition-all duration-500 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-[var(--color-muted)] tabular-nums w-8 text-right">
            {Math.round(progress * 100)}%
          </span>
        </div>
      ) : null}

      {/* Contenu de l'étape — la key relance le fade-in à chaque écran */}
      <div key={step} className="animate-fade-in flex-1 flex flex-col overflow-y-auto px-6 pt-6 pb-4">
        {step === "welcome" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[28px] bg-[var(--color-forest)] flex items-center justify-center shadow-[0_16px_32px_-12px_rgba(15,46,35,0.5)]">
              <Leaf className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            <h1 className="mt-8 text-[32px] font-extrabold text-[var(--color-forest-deep)] tracking-tight">
              Bienvenue
            </h1>
            <p className="mt-3 text-[14px] text-[var(--color-ink-soft)] leading-relaxed max-w-[260px]">
              SaneFit construit un coaching sport &amp; nutrition qui te ressemble.
              Quelques questions suffisent.
            </p>
          </div>
        )}

        {step === "name" && (
          <StepShell
            title="Comment t'appelles-tu ?"
            subtitle="Ton prénom personnalise ton espace et tes messages de coaching."
          >
            <input
              type="text"
              value={answers.userName}
              onChange={(e) => setAnswers((a) => ({ ...a, userName: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && answers.userName.trim()) next();
              }}
              placeholder="Ton prénom"
              autoFocus
              className="w-full bg-white rounded-2xl border-2 border-black/[0.06] px-4 py-4 text-[16px] font-semibold text-[var(--color-ink)] placeholder:text-[var(--color-muted)] placeholder:font-normal outline-none focus:border-[#34C759] transition-colors"
            />
          </StepShell>
        )}

        {step === "objectif" && (
          <StepShell
            title="Quel est ton objectif principal ?"
            subtitle="Ton programme sport et tes repères nutrition en découlent directement."
          >
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "perte_poids", label: "Perte de Poids", icon: Flame },
                  { id: "prise_masse", label: "Prise de Masse", icon: Dumbbell },
                  { id: "endurance", label: "Endurance", icon: Activity },
                  { id: "bien_etre", label: "Bien-être", icon: Leaf },
                ] as { id: Objectif; label: string; icon: typeof Flame }[]
              ).map(({ id, label, icon: Icon }) => (
                <OptionCard
                  key={id}
                  selected={answers.objectif === id}
                  onSelect={() => setAnswers((a) => ({ ...a, objectif: id }))}
                  icon={<Icon className="w-5 h-5" strokeWidth={2.4} />}
                  label={label}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === "biologie" && (
          <StepShell
            title="Ton sexe biologique"
            subtitle="Nécessaire pour les équations métaboliques et tes seuils de santé."
          >
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "homme", label: "Homme", symbol: "♂" },
                  { id: "femme", label: "Femme", symbol: "♀" },
                ] as { id: Biologie; label: string; symbol: string }[]
              ).map(({ id, label, symbol }) => (
                <OptionCard
                  key={id}
                  tall
                  selected={answers.biologie === id}
                  onSelect={() => setAnswers((a) => ({ ...a, biologie: id }))}
                  icon={<span className="text-[22px] font-bold leading-none">{symbol}</span>}
                  label={label}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === "corps" && (
          <StepShell
            title="Ton corps"
            subtitle="Ces mesures alimentent les équations métaboliques de ton coaching."
          >
            <div className="space-y-3">
              <AgeStepper
                value={answers.age}
                onChange={(v) => setAnswers((a) => ({ ...a, age: v }))}
              />
              <SliderField
                label="Taille"
                unit="cm"
                min={HEIGHT_MIN}
                max={HEIGHT_MAX}
                value={answers.heightCm}
                onChange={(v) => setAnswers((a) => ({ ...a, heightCm: v }))}
              />
              <SliderField
                label="Poids actuel"
                unit="kg"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                step={0.5}
                value={answers.weightKg}
                onChange={(v) => setAnswers((a) => ({ ...a, weightKg: v }))}
                format={(v) => v.toLocaleString("fr-FR")}
              />
            </div>
          </StepShell>
        )}

        {step === "poids_cible" && (
          <StepShell
            title="Ton poids cible"
            subtitle="Un objectif réaliste est la meilleure garantie de résultats durables."
          >
            <div className="space-y-3">
              <SliderField
                label="Poids cible"
                unit="kg"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                step={0.5}
                value={goalKg}
                onChange={(v) => setAnswers((a) => ({ ...a, weightGoalKg: v }))}
                format={(v) => v.toLocaleString("fr-FR")}
              />

              <div className="bg-white rounded-2xl border-2 border-black/[0.06] p-4 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[var(--color-ink)]">
                  Écart vs aujourd&apos;hui
                </span>
                <span
                  className={cn(
                    "text-[18px] font-extrabold tabular-nums",
                    goalDeltaKg < 0 && "text-[#e58a2b]",
                    goalDeltaKg > 0 && "text-[var(--color-forest)]",
                    goalDeltaKg === 0 && "text-[var(--color-muted)]",
                  )}
                >
                  {goalDeltaKg > 0 ? "+" : ""}
                  {goalDeltaKg.toLocaleString("fr-FR")} kg
                </span>
              </div>

              {!goalRealistic ? (
                <div className="flex items-start gap-2.5 bg-[var(--color-warn-bg)] border border-[var(--color-warn-border)] rounded-2xl p-3.5">
                  <TriangleAlert className="w-4 h-4 text-[var(--color-warn)] shrink-0 mt-0.5" strokeWidth={2.4} />
                  <p className="text-[12px] text-[var(--color-warn)] font-semibold leading-snug">
                    Cet objectif dépasse ±40 % de ton poids actuel — ce n&apos;est pas
                    compatible avec un coaching sain. Ajuste-le pour continuer.
                  </p>
                </div>
              ) : goalMismatch ? (
                <div className="flex items-start gap-2.5 bg-[#fdf3dc] border border-[#ecd9a0] rounded-2xl p-3.5">
                  <HelpCircle className="w-4 h-4 text-[#a07b1e] shrink-0 mt-0.5" strokeWidth={2.4} />
                  <p className="text-[12px] text-[#a07b1e] font-semibold leading-snug">
                    {answers.objectif === "perte_poids"
                      ? "Ton objectif est la perte de poids, mais ce poids cible est supérieur à ton poids actuel."
                      : "Ton objectif est la prise de masse, mais ce poids cible est inférieur à ton poids actuel."}
                  </p>
                </div>
              ) : null}
            </div>
          </StepShell>
        )}

        {step === "delai" && (
          <StepShell
            title="En combien de temps ?"
            subtitle="Un bon plan se juge à son rythme, pas à sa vitesse. Le Gardien de Santé veille."
          >
            <div className="space-y-3">
              <SliderField
                label="Durée du plan"
                unit="sem"
                min={PLAN_WEEKS_MIN}
                max={PLAN_WEEKS_MAX}
                value={weeksValue}
                onChange={(v) => setAnswers((a) => ({ ...a, targetWeeks: v }))}
              />

              <div
                className={cn(
                  "rounded-2xl border-2 p-4 flex items-center justify-between",
                  pace.dangerous
                    ? "bg-[var(--color-warn-bg)] border-[var(--color-warn-border)]"
                    : "bg-white border-black/[0.06]",
                )}
              >
                <span className="text-[13px] font-bold text-[var(--color-ink)]">
                  Rythme induit
                </span>
                <span
                  className={cn(
                    "text-[18px] font-extrabold tabular-nums",
                    pace.dangerous ? "text-[var(--color-warn)]" : "text-[var(--color-forest)]",
                  )}
                >
                  {goalDeltaKg < 0 ? "−" : "+"}
                  {pace.ratePerWeek.toLocaleString("fr-FR")} kg/sem
                </span>
              </div>

              <p className="text-[11.5px] text-[var(--color-muted)] leading-relaxed px-1">
                Rythme sain recommandé : 0,5 à {MAX_LOSS_KG_PER_WEEK} kg par semaine.
                Au-delà, ton corps puise dans le muscle et ralentit ton métabolisme.
              </p>
            </div>
          </StepShell>
        )}

        {step === "activite" && (
          <StepShell
            title="Ton niveau d'activité quotidienne"
            subtitle="Il détermine ta dépense énergétique de référence."
          >
            <div className="space-y-3">
              {(
                [
                  { id: "sedentaire", label: "Sédentaire", sublabel: "Travail de bureau, peu de déplacement.", icon: Armchair },
                  { id: "leger", label: "Légèrement actif", sublabel: "1-2 séances de sport par semaine.", icon: Footprints },
                  { id: "modere", label: "Modérément actif", sublabel: "3-4 séances par semaine.", icon: Bike },
                  { id: "tres_actif", label: "Très actif", sublabel: "5 séances ou plus par semaine.", icon: Zap },
                ] as { id: ActivityLevel; label: string; sublabel: string; icon: typeof Zap }[]
              ).map(({ id, label, sublabel, icon: Icon }) => (
                <OptionCard
                  key={id}
                  selected={answers.activityLevel === id}
                  onSelect={() => setAnswers((a) => ({ ...a, activityLevel: id }))}
                  icon={<Icon className="w-5 h-5" strokeWidth={2.4} />}
                  label={label}
                  sublabel={sublabel}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === "sommeil" && (
          <StepShell
            title="Combien dors-tu par nuit ?"
            subtitle="Le sommeil conditionne ta récupération et tes progrès."
          >
            <div className="space-y-3">
              {(
                [
                  { id: "moins_6h", label: "Moins de 6h", sublabel: "Sommeil court — la récupération sera surveillée.", icon: AlarmClock },
                  { id: "6_8h", label: "6 à 8h", sublabel: "Dans la moyenne recommandée.", icon: Moon },
                  { id: "8h_plus", label: "8h ou plus", sublabel: "Récupération optimale.", icon: BedDouble },
                ] as { id: SleepRange; label: string; sublabel: string; icon: typeof Moon }[]
              ).map(({ id, label, sublabel, icon: Icon }) => (
                <OptionCard
                  key={id}
                  selected={answers.sleep === id}
                  onSelect={() => setAnswers((a) => ({ ...a, sleep: id }))}
                  icon={<Icon className="w-5 h-5" strokeWidth={2.4} />}
                  label={label}
                  sublabel={sublabel}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === "regimes" && (
          <StepShell
            title="As-tu déjà fait des régimes très restrictifs ?"
            subtitle="Un historique de restriction change la façon dont on progresse ensemble."
          >
            <div className="space-y-3">
              <OptionCard
                selected={answers.restrictiveDietHistory === true}
                onSelect={() => setAnswers((a) => ({ ...a, restrictiveDietHistory: true }))}
                icon={<History className="w-5 h-5" strokeWidth={2.4} />}
                label="Oui"
                sublabel="On adoptera une progression douce, sans restriction agressive."
              />
              <OptionCard
                selected={answers.restrictiveDietHistory === false}
                onSelect={() => setAnswers((a) => ({ ...a, restrictiveDietHistory: false }))}
                icon={<ShieldCheck className="w-5 h-5" strokeWidth={2.4} />}
                label="Non"
                sublabel="Approche standard, ajustée à tes objectifs."
              />
            </div>
          </StepShell>
        )}

        {step === "supplements" && (
          <StepShell
            title="Quels compléments veux-tu suivre ?"
            subtitle="Active uniquement ceux qui t'intéressent — appuie sur [?] pour comprendre chacun avant de décider. Seuls tes choix apparaîtront dans l'app."
          >
            <div className="space-y-2.5 pb-2">
              {SUPPLEMENTS.map((s) => {
                const selected = answers.acceptedSupplements?.includes(s.id) ?? false;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 bg-white rounded-2xl border-2 p-3.5 transition-all",
                      selected
                        ? "border-[#34C759] shadow-[0_6px_18px_-8px_rgba(52,199,89,0.5)]"
                        : "border-black/[0.06]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSupplement(s.id)}
                      aria-pressed={selected}
                      aria-label={`${selected ? "Retirer" : "Ajouter"} ${s.name}`}
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
                        selected
                          ? "bg-[#34C759] border-[#34C759] text-white"
                          : "border-black/15 text-transparent hover:border-[#34C759]",
                      )}
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSupplement(s.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <span className="block text-[13.5px] font-bold text-[var(--color-ink)]">
                        {s.name}
                      </span>
                      <span className="block text-[10.5px] text-[var(--color-muted)] truncate">
                        {s.shortDesc}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInfoSupplement(s.id)}
                      aria-label={`En savoir plus sur ${s.name}`}
                      className="w-8 h-8 rounded-full bg-[var(--color-forest)]/8 text-[var(--color-forest)] flex items-center justify-center shrink-0 hover:bg-[var(--color-forest)]/15 transition-colors"
                    >
                      <HelpCircle className="w-4.5 h-4.5 w-[18px] h-[18px]" strokeWidth={2.4} />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, acceptedSupplements: [] }))}
                aria-pressed={answers.acceptedSupplements?.length === 0}
                className={cn(
                  "w-full flex items-center gap-3 rounded-2xl border-2 p-3.5 transition-all text-left",
                  answers.acceptedSupplements?.length === 0
                    ? "bg-[var(--color-forest)]/5 border-[var(--color-forest)]"
                    : "bg-white border-black/[0.06] hover:border-black/15",
                )}
              >
                <span
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                    answers.acceptedSupplements?.length === 0
                      ? "bg-[var(--color-forest)] text-white"
                      : "bg-black/[0.06] text-[var(--color-muted)]",
                  )}
                >
                  <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2.6} />
                </span>
                <span>
                  <span className="block text-[13.5px] font-bold text-[var(--color-ink)]">
                    Je ne souhaite aucun complément
                  </span>
                  <span className="block text-[10.5px] text-[var(--color-muted)]">
                    Rien ne sera jamais affiché ni conseillé.
                  </span>
                </span>
              </button>
            </div>
          </StepShell>
        )}

        {step === "recap" && config && (
          <div className="flex flex-col">
            <div className="flex flex-col items-center text-center">
              <div className="animate-pop-in w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(52,199,89,0.6)]">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <h2 className="mt-4 text-[24px] font-extrabold text-[var(--color-forest-deep)] tracking-tight">
                Ton profil est prêt, {config.userName} !
              </h2>
              <p className="mt-1.5 text-[13px] text-[var(--color-ink-soft)]">
                Voici comment ton app a été configurée.
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
                  Profil physiologique
                </p>
                <p className="text-[14px] font-bold text-[var(--color-ink)] mt-1">
                  {config.age} ans · {config.heightCm} cm · {config.weightKg.toLocaleString("fr-FR")} kg
                  <span className="font-medium text-[var(--color-muted)]"> → </span>
                  {config.weightGoalKg.toLocaleString("fr-FR")} kg
                  {config.weightGoalKg !== config.weightKg ? (
                    <span className="font-medium text-[var(--color-muted)]">
                      {" "}
                      en {config.targetWeeks} semaines
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
                  Séance prioritaire
                </p>
                <p className="text-[14px] font-bold text-[var(--color-ink)] mt-1">
                  {getWorkoutPlan(config.objectif).title}
                  <span className="font-medium text-[var(--color-muted)]">
                    {" "}
                    · {getWorkoutPlan(config.objectif).durationMin} min
                  </span>
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
                  Compléments alimentaires
                </p>
                {config.acceptedSupplements.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {config.acceptedSupplements.map((id) => (
                      <span
                        key={id}
                        className="text-[11px] font-bold text-[#249144] bg-[#34C759]/10 rounded-full px-2.5 py-1"
                      >
                        {getSupplement(id).name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] font-bold text-[var(--color-ink)] mt-1">
                    Aucun — jamais affichés ni conseillés
                  </p>
                )}
              </div>

              {(() => {
                const m = computeMetabolics(config);
                return (
                  <>
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
                      Calcul métabolique (Mifflin-St Jeor)
                    </p>
                    <div className="mt-2.5 space-y-1.5 text-[12.5px] text-[var(--color-ink)]">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-ink-soft)]">Métabolisme de base</span>
                        <span className="font-bold tabular-nums">{m.mb} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-ink-soft)]">
                          × activité ({m.activityFactor}) → TDEE
                        </span>
                        <span className="font-bold tabular-nums">{m.tdee} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-ink-soft)]">{describeAdjustment(m)}</span>
                        <span className="font-extrabold tabular-nums text-[var(--color-forest)]">
                          {m.targetCalories} kcal
                        </span>
                      </div>
                    </div>
                    {m.floorApplied ? (
                      <p className="mt-2 text-[11px] font-semibold text-[#a07b1e] leading-snug">
                        Cible relevée au plancher de sécurité ({m.calorieFloor} kcal) — jamais
                        sous ton métabolisme de base.
                      </p>
                    ) : null}
                    <div className="mt-3 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[12px]">
                      <span className="font-bold text-[var(--color-macro-p)]">
                        P {m.macros.protein} g
                        <span className="block text-[10px] font-medium text-[var(--color-muted)]">
                          {m.proteinPerKg} g/kg
                        </span>
                      </span>
                      <span className="font-bold text-[var(--color-macro-l)]">
                        L {m.macros.fat} g
                        <span className="block text-[10px] font-medium text-[var(--color-muted)]">
                          {m.fatPerKg} g/kg
                        </span>
                      </span>
                      <span className="font-bold text-[var(--color-macro-g)]">
                        G {m.macros.carbs} g
                        <span className="block text-[10px] font-medium text-[var(--color-muted)]">
                          le reste
                        </span>
                      </span>
                      <span className="font-bold text-[#2d7fa8]">
                        {(m.waterMl / 1000).toFixed(1)} L
                        <span className="block text-[10px] font-medium text-[var(--color-muted)]">
                          35 ml/kg
                        </span>
                      </span>
                    </div>
                  </div>
                  <DoctorAvatar className="pt-1" message={getCalorieEducation(m).message} />
                  </>
                );
              })()}

              {config.restrictiveDietHistory ? (
                <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
                    Historique de régimes restrictifs
                  </p>
                  <p className="text-[14px] font-bold text-[var(--color-ink)] mt-1">
                    Progression douce activée — jamais de restriction agressive
                  </p>
                </div>
              ) : null}

              {/* Pédagogie anti-dérive : pourquoi ce plan est sain */}
              <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
                  Pourquoi ce plan est sain
                </p>
                <div className="mt-3 space-y-3.5">
                  <div className="flex gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[var(--color-forest)]/8 flex items-center justify-center shrink-0">
                      <Gauge className="w-4 h-4 text-[var(--color-forest)]" strokeWidth={2.4} />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-bold text-[var(--color-ink)]">
                        Un rythme maîtrisé
                      </p>
                      <p className="text-[11.5px] text-[var(--color-ink-soft)] leading-snug mt-0.5">
                        {config.weightGoalKg < config.weightKg
                          ? `${assessGoalPace(config.weightKg, config.weightGoalKg, config.targetWeeks).ratePerWeek.toLocaleString("fr-FR")} kg/semaine sur ${config.targetWeeks} semaines — dans la zone saine (1 kg/sem max). Plus lent = plus durable.`
                          : config.weightGoalKg > config.weightKg
                            ? "Un surplus léger et une prise progressive : du muscle, pas du gras stocké."
                            : "L'équilibre énergétique : la régularité compte plus que la vitesse."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[var(--color-forest)]/8 flex items-center justify-center shrink-0">
                      <Salad className="w-4 h-4 text-[var(--color-forest)]" strokeWidth={2.4} />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-bold text-[var(--color-ink)]">
                        Les micro-nutriments d&apos;abord
                      </p>
                      <p className="text-[11.5px] text-[var(--color-ink-soft)] leading-snug mt-0.5">
                        Les calories et les protéines ne font pas tout : légumes, fruits et
                        fibres (25-30 g/jour) protègent ton énergie, ton microbiote et ta
                        satiété.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[var(--color-forest)]/8 flex items-center justify-center shrink-0">
                      <PieChart className="w-4 h-4 text-[var(--color-forest)]" strokeWidth={2.4} />
                    </span>
                    <div>
                      <p className="text-[12.5px] font-bold text-[var(--color-ink)]">
                        La règle des 80/20
                      </p>
                      <p className="text-[11.5px] text-[var(--color-ink-soft)] leading-snug mt-0.5">
                        80 % d&apos;aliments bruts et denses en nutriments, 20 % de plaisir
                        assumé : c&apos;est ce qui rend un plan tenable des années, pas des
                        semaines.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-forest-deep)] rounded-2xl p-4 overflow-hidden">
                <p className="text-[11px] uppercase tracking-wider font-bold text-white/50">
                  UserConfig
                </p>
                <pre className="mt-2 text-[10px] leading-relaxed text-[#7fe0a7] font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA bas d'écran */}
      <div className="px-6 pb-9 pt-2">
        {step === "welcome" && <PrimaryButton label="Commencer mon voyage" onClick={next} />}
        {questionSteps.includes(step) && (
          <PrimaryButton label="Continuer" onClick={next} disabled={!canContinue} />
        )}
        {step === "recap" && config && (
          <PrimaryButton label="Découvrir mon dashboard" onClick={() => onComplete(config)} />
        )}
      </div>

      {/* Sheet pédagogique iOS */}
      {infoSupplement ? (
        <SupplementSheet
          supplement={getSupplement(infoSupplement)}
          objectif={answers.objectif ?? "bien_etre"}
          onClose={() => setInfoSupplement(null)}
        />
      ) : null}
    </div>
  );
}

function SheetSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-forest)]">
        {label}
      </p>
      <p className="text-[12.5px] text-[var(--color-ink-soft)] leading-relaxed mt-1">{children}</p>
    </div>
  );
}

function SupplementSheet({
  supplement,
  objectif,
  onClose,
}: {
  supplement: ReturnType<typeof getSupplement>;
  objectif: Objectif;
  onClose: () => void;
}) {
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
        aria-label={supplement.name}
        className="animate-sheet-up absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] max-h-[78%] flex flex-col"
      >
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="w-9 h-1.5 rounded-full bg-black/15" />
        </div>
        <div className="px-5 pb-2 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-[18px] font-extrabold text-[var(--color-forest-deep)] leading-tight">
              {supplement.name}
            </h3>
            <p className="text-[11px] text-[var(--color-muted)] font-semibold mt-0.5">
              Dose repère : {supplement.dose}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche"
            className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center text-[var(--color-ink)] shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.6} />
          </button>
        </div>
        <div className="px-5 pb-8 pt-1 space-y-4 overflow-y-auto">
          <SheetSection label="C'est quoi ?">{supplement.cQuoi}</SheetSection>
          <SheetSection label="Est-ce obligatoire ?">{supplement.obligatoire}</SheetSection>
          <SheetSection label="Ce que ça t'apporte">
            {supplement.benefitByObjectif[objectif]}
          </SheetSection>
          <SheetSection label="Sécurité">{supplement.securite}</SheetSection>
          <DoctorAvatar
            className="pt-1"
            message={getSupplementEducation(supplement.name).message}
          />
        </div>
      </div>
    </div>
  );
}
