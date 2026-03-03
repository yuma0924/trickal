"use client";

import { useTheme } from "@/components/ui/theme-provider";

const THEME_OPTIONS = [
  { value: "dark" as const, label: "D" },
  { value: "light" as const, label: "L" },
  { value: "auto" as const, label: "A" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-lg border border-border-primary bg-bg-tertiary p-0.5">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            theme === option.value
              ? "bg-accent text-accent-text"
              : "text-text-secondary hover:text-text-primary"
          }`}
          aria-label={`テーマを${option.value === "dark" ? "ダーク" : option.value === "light" ? "ライト" : "自動"}に変更`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
