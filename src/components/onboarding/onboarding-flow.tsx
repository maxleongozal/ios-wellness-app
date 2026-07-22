"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Check,
  ChevronLeft,
  Dumbbell,
  Flame,
  HelpCircle,
  Leaf,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type {
  Biologie,
  Objectif,
  OnboardingAnswers,
  StanceSupplements,
  UserConfig,
} from "@/types";
import { buildUserConfig, getWorkoutPlan } from "@/lib/user-config";
import { cn } from "@/lib/utils";

type Step = "welcome" | "name" | "objectif" | "biologie" | "supplements" | "recap";

const STEPS: Step[] = ["welcome", "name", "objectif", "biologie", "supplements", "recap"];
const QUESTION_STEPS: Step[] = ["name", "objectif", "biologie", "supplements"];

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
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    userName: "",
    biologie: null,
    objectif: null,
    stanceSupplements: null,
  });

  const stepIndex = STEPS.indexOf(step);
  const questionIndex = QUESTION_STEPS.indexOf(step);
  // Barre de progression : name 25% → objectif 50% → biologie 75% → supplements 100%.
  const progress =
    step === "welcome" ? 0 : step === "recap" ? 1 : (questionIndex + 1) / QUESTION_STEPS.length;

  const config = useMemo(
    () => (step === "recap" ? buildUserConfig(answers) : null),
    [step, answers],
  );

  const next = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]);

  const canContinue =
    (step === "name" && answers.userName.trim().length > 0) ||
    (step === "objectif" && answers.objectif !== null) ||
    (step === "biologie" && answers.biologie !== null) ||
    (step === "supplements" && answers.stanceSupplements !== null);

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
            title="Ta biologie"
            subtitle="Nécessaire pour calibrer tes seuils de santé et tes macros de référence."
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

        {step === "supplements" && (
          <StepShell
            title="Fais-tu confiance aux compléments alimentaires ?"
            subtitle="Créatine, whey, vitamines… Ta réponse active ou retire tout ce sujet de ton app."
          >
            <div className="space-y-3">
              {(
                [
                  {
                    id: "open",
                    label: "Oui",
                    sublabel: "Un module de suivi des compléments sera activé.",
                    icon: ThumbsUp,
                  },
                  {
                    id: "against",
                    label: "Non",
                    sublabel: "Aucun complément ne sera jamais affiché ni conseillé.",
                    icon: ThumbsDown,
                  },
                  {
                    id: "hesitant",
                    label: "Peut-être",
                    sublabel: "On reste neutre : pas de suivi, pas de recommandation active.",
                    icon: HelpCircle,
                  },
                ] as {
                  id: StanceSupplements;
                  label: string;
                  sublabel: string;
                  icon: typeof ThumbsUp;
                }[]
              ).map(({ id, label, sublabel, icon: Icon }) => (
                <OptionCard
                  key={id}
                  selected={answers.stanceSupplements === id}
                  onSelect={() => setAnswers((a) => ({ ...a, stanceSupplements: id }))}
                  icon={<Icon className="w-5 h-5" strokeWidth={2.4} />}
                  label={label}
                  sublabel={sublabel}
                />
              ))}
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
                <p className="text-[14px] font-bold text-[var(--color-ink)] mt-1">
                  {config.stanceSupplements === "open" && "Module « Suivi des compléments » activé"}
                  {config.stanceSupplements === "against" && "Désactivés — jamais affichés ni conseillés"}
                  {config.stanceSupplements === "hesitant" && "Neutre — aucun suivi actif"}
                </p>
              </div>

              {config.biologie === "femme" && config.objectif === "perte_poids" ? (
                <div className="bg-white rounded-2xl border border-black/[0.06] p-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-muted)]">
                    Macros ajustées
                  </p>
                  <p className="text-[14px] font-bold text-[var(--color-ink)] mt-1">
                    Ratio standard féminin · 1800 kcal
                  </p>
                </div>
              ) : null}

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
        {QUESTION_STEPS.includes(step) && (
          <PrimaryButton label="Continuer" onClick={next} disabled={!canContinue} />
        )}
        {step === "recap" && config && (
          <PrimaryButton label="Découvrir mon dashboard" onClick={() => onComplete(config)} />
        )}
      </div>
    </div>
  );
}
