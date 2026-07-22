import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface IphoneFrameProps {
  children: ReactNode;
  className?: string;
}

export function IphoneFrame({ children, className }: IphoneFrameProps) {
  return (
    <div
      className={cn(
        "relative w-[390px] h-[844px] rounded-[56px] bg-[#0d0d0d] p-[14px] shadow-[0_40px_80px_-20px_rgba(15,46,35,0.35),0_20px_40px_-10px_rgba(0,0,0,0.35),inset_0_0_0_2px_#1f1f1f]",
        className,
      )}
    >
      {/* Side buttons */}
      <div className="absolute -left-[3px] top-[110px] w-[3px] h-[32px] rounded-l-sm bg-[#1a1a1a]" />
      <div className="absolute -left-[3px] top-[170px] w-[3px] h-[60px] rounded-l-sm bg-[#1a1a1a]" />
      <div className="absolute -left-[3px] top-[248px] w-[3px] h-[60px] rounded-l-sm bg-[#1a1a1a]" />
      <div className="absolute -right-[3px] top-[190px] w-[3px] h-[100px] rounded-r-sm bg-[#1a1a1a]" />

      <div className="relative w-full h-full rounded-[44px] overflow-hidden bg-[var(--color-cream)]">
        {/* Dynamic Island */}
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[110px] h-[34px] rounded-full bg-black z-50" />
        {children}
      </div>
    </div>
  );
}
