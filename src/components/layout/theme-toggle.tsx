"use client";

import { useTheme } from "@/components/ui/theme-provider";

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const themeIcon = {
  dark: <MoonIcon />,
  light: <SunIcon />,
  auto: <MonitorIcon />,
} as const;

const themeLabel = {
  dark: "ダーク",
  light: "ライト",
  auto: "自動",
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={cycle}
      className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-border-primary bg-bg-tertiary text-text-tertiary transition-all duration-200 hover:text-text-primary"
      aria-label={`テーマ切替（現在: ${themeLabel[theme]}）`}
      title={themeLabel[theme]}
    >
      {themeIcon[theme]}
    </button>
  );
}
