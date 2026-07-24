"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { DOCTOR_DISCLAIMER, type DoctorSeverity } from "@/lib/doctor-engine";
import { cn } from "@/lib/utils";

interface DoctorAvatarProps {
  message: string;
  /** Teinte la bulle selon la gravité de l'intervention. */
  severity?: DoctorSeverity;
  /** Halo vert + point de statut animé : le médecin délivre un conseil actif. */
  active?: boolean;
  className?: string;
}

const DISCLAIMER_SEEN_KEY = "sanefit_doctor_disclaimer_seen";

const bubbleBySeverity: Record<DoctorSeverity, string> = {
  info: "bg-white border-black/[0.05]",
  warning: "bg-[#fffdf4] border-[#ecd9a0]",
  danger: "bg-[#fffaf7] border-[var(--color-warn-border)]",
};

const nameBySeverity: Record<DoctorSeverity, string> = {
  info: "text-[var(--color-forest)]",
  warning: "text-[#a07b1e]",
  danger: "text-[var(--color-warn)]",
};

/** Avatar illustré du Dr. Sane — style memoji iOS épuré, aux couleurs de l'app. */
function DoctorIllustration() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#dcefe2" />
      {/* cou */}
      <rect x="27" y="33" width="10" height="10" rx="3.5" fill="#eab890" />
      {/* blouse blanche */}
      <path d="M12 64 Q13 45 32 45 Q51 45 52 64 Z" fill="#ffffff" />
      <path d="M25.5 46 L32 54.5 L38.5 46" fill="none" stroke="#e3e8e5" strokeWidth="1.5" />
      {/* chemise */}
      <path d="M27.5 45.5 L32 51.5 L36.5 45.5 Z" fill="#1f5b47" />
      {/* stéthoscope */}
      <path d="M24 49.5 Q24 58 31.5 58.5" fill="none" stroke="#163f31" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="58.5" r="2.6" fill="#163f31" />
      <circle cx="34" cy="58.5" r="1.1" fill="#dcefe2" />
      {/* tête */}
      <circle cx="19.8" cy="26" r="2.2" fill="#eab890" />
      <circle cx="44.2" cy="26" r="2.2" fill="#eab890" />
      <circle cx="32" cy="26" r="12.5" fill="#f2c9a4" />
      {/* cheveux */}
      <path
        d="M19.5 26 Q19 13.5 32 13.5 Q45 13.5 44.5 26 Q44 20.5 39.5 19 Q33.5 17 28 18.5 Q20.5 20.5 19.5 26 Z"
        fill="#4a3a2c"
      />
      {/* lunettes */}
      <circle cx="27" cy="26.5" r="3.4" fill="none" stroke="#2c3a33" strokeWidth="1.3" />
      <circle cx="37" cy="26.5" r="3.4" fill="none" stroke="#2c3a33" strokeWidth="1.3" />
      <path d="M30.4 26.5 L33.6 26.5" stroke="#2c3a33" strokeWidth="1.3" />
      {/* yeux + sourire */}
      <circle cx="27" cy="26.5" r="1.2" fill="#1a2b23" />
      <circle cx="37" cy="26.5" r="1.2" fill="#1a2b23" />
      <path d="M28.5 32 Q32 34.8 35.5 32" fill="none" stroke="#b57d55" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function DoctorAvatar({
  message,
  severity = "info",
  active = false,
  className,
}: DoctorAvatarProps) {
  const [speaking, setSpeaking] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Mention légale : une seule fois, au tout premier lancement du médecin.
  useEffect(() => {
    if (localStorage.getItem(DISCLAIMER_SEEN_KEY)) return;
    localStorage.setItem(DISCLAIMER_SEEN_KEY, "1");
    setShowDisclaimer(true);
  }, []);

  // Un nouveau message ou un démontage interrompt toujours la lecture en cours.
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    };
  }, [message]);

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  const toggleSpeech = () => {
    if (!canSpeak) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "fr-FR";
    const frenchVoice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith("fr"));
    if (frenchVoice) utterance.voice = frenchVoice;
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const talking = active || speaking || severity !== "info";

  return (
    <div className={className}>
    <div className="flex items-end gap-2.5">
      <div className="relative shrink-0">
        <div
          className={cn(
            "w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-[0_4px_12px_-4px_rgba(15,46,35,0.35)]",
            talking && "animate-halo-pulse",
          )}
        >
          <DoctorIllustration />
        </div>
        {talking ? (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
            <span className="animate-mini-pulse w-2.5 h-2.5 rounded-full bg-[#34C759]" />
          </span>
        ) : null}
      </div>

      {/* La key relance le slide-up/fade-in à chaque nouveau message */}
      <div
        key={message}
        className={cn(
          "animate-fade-in relative flex-1 min-w-0 rounded-2xl rounded-bl-[6px] border px-3.5 py-3 shadow-[0_8px_20px_-10px_rgba(15,46,35,0.3)]",
          bubbleBySeverity[severity],
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-[11px] font-extrabold", nameBySeverity[severity])}>
            Dr. Sane
            <span className="font-semibold text-[var(--color-muted)]"> · Médecin référent</span>
          </p>
          {canSpeak ? (
            <button
              type="button"
              onClick={toggleSpeech}
              aria-label={speaking ? "Arrêter la lecture" : "Écouter le conseil"}
              aria-pressed={speaking}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                speaking
                  ? "bg-[#34C759]/15 text-[#249144]"
                  : "bg-black/[0.05] text-[var(--color-muted)] hover:text-[var(--color-forest)]",
              )}
            >
              {speaking ? (
                <VolumeX className="w-3.5 h-3.5" strokeWidth={2.4} />
              ) : (
                <Volume2 className="w-3.5 h-3.5" strokeWidth={2.4} />
              )}
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--color-ink)]/85 leading-snug">{message}</p>
      </div>
    </div>

    {showDisclaimer ? (
      <p className="mt-2 pl-[58px] text-[9.5px] italic text-[var(--color-muted)] leading-snug">
        {DOCTOR_DISCLAIMER}
      </p>
    ) : null}
    </div>
  );
}
