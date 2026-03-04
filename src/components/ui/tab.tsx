"use client";

import { cn } from "@/lib/utils";

interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tab<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-full bg-bg-tertiary p-1",
        className
      )}
      role="tablist"
    >
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            value === item.value
              ? "bg-accent text-white"
              : "bg-bg-tertiary text-text-tertiary hover:text-text-secondary"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
