import { Bell } from "lucide-react";

interface ScreenHeaderProps {
  greeting: string;
  hasNotification?: boolean;
}

export function ScreenHeader({ greeting, hasNotification = true }: ScreenHeaderProps) {
  return (
    <div className="relative bg-[var(--color-forest)] px-6 pt-1 pb-5 rounded-b-[28px] shadow-[0_10px_20px_-12px_rgba(15,46,35,0.35)]">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-[22px] font-extrabold tracking-wide uppercase">
          {greeting}
        </h1>
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
        >
          <Bell className="w-4 h-4 text-white" strokeWidth={2.4} />
          {hasNotification ? (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-warn)] ring-2 ring-[var(--color-forest)]" />
          ) : null}
        </button>
      </div>
    </div>
  );
}
