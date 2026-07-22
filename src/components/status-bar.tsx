"use client";

import { useEffect, useState } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  tone?: "light" | "dark";
}

export function StatusBar({ tone = "light" }: StatusBarProps) {
  const [time, setTime] = useState("9:41");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      setTime(`${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const color = tone === "light" ? "text-white" : "text-[var(--color-ink)]";

  return (
    <div
      className={cn(
        "relative z-40 flex items-center justify-between px-8 pt-3 pb-1 text-[15px] font-semibold",
        color,
      )}
    >
      <span className="tabular-nums">{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal className="w-4 h-4" strokeWidth={2.5} />
        <Wifi className="w-4 h-4" strokeWidth={2.5} />
        <BatteryFull className="w-5 h-5" strokeWidth={2.5} />
      </div>
    </div>
  );
}
