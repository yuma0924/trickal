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
        "flex gap-1 rounded-lg bg-bg-tertiary p-1",
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
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            value === item.value
              ? "bg-accent text-accent-text"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
