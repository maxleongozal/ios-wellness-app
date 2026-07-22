"use client";

import { AlertTriangle, X } from "lucide-react";
import type { Warning } from "@/types";
import { cn } from "@/lib/utils";

interface WarningBannerProps {
  warning: Warning;
  onDismiss: (id: string) => void;
}

const severityStyle: Record<Warning["severity"], string> = {
  info: "bg-[#eaf3ec] border-[#b6d5bd] text-[var(--color-forest-dark)]",
  warning: "bg-[#fff2d1] border-[#e6c67a] text-[#7a4f00]",
  danger:
    "bg-[var(--color-warn-bg)] border-[var(--color-warn-border)] text-[var(--color-warn)]",
};

export function WarningBanner({ warning, onDismiss }: WarningBannerProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 px-4 py-4 shadow-sm",
        severityStyle[warning.severity],
      )}
    >
      <button
        type="button"
        onClick={() => onDismiss(warning.id)}
        aria-label="Fermer"
        className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5"
      >
        <X className="w-4 h-4" strokeWidth={2.4} />
      </button>
      <div className="flex items-start gap-2 pr-6">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.4} />
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold uppercase tracking-wide leading-tight">
            {warning.title}
          </p>
          <p className="text-[12.5px] mt-1.5 text-[var(--color-ink)]/85 leading-snug">
            {warning.message}
          </p>
          {warning.detail ? (
            <p className="text-[12.5px] mt-1 font-semibold text-[var(--color-ink)]/85 leading-snug">
              {warning.detail}
            </p>
          ) : null}
        </div>
      </div>
      {warning.cta ? (
        <button
          type="button"
          className="mt-3 w-full py-2.5 rounded-full bg-[var(--color-forest)] text-white text-[13px] font-semibold uppercase tracking-wide hover:bg-[var(--color-forest-dark)] transition-colors"
        >
          {warning.cta}
        </button>
      ) : null}
    </div>
  );
}
