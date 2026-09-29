"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const subscribe = () => () => {};

/** Light / Dark / System segmented switch. `showLabels` for roomier spots like Settings. */
export function ThemeToggle({ showLabels = false, className }: { showLabels?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client; render neutral until mounted.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5", className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
              active
                ? "bg-card text-foreground shadow-soft ring-1 ring-border"
                : "text-fg-subtle hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {showLabels && label}
          </button>
        );
      })}
    </div>
  );
}
