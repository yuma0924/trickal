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
        "flex gap-1 overflow-x-auto rounded-full bg-bg-tertiary p-1",
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
            "shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer",
            value === item.value
              ? "bg-accent text-white shadow-sm shadow-[0_1px_3px_rgba(251,100,182,0.3)]"
              : "text-text-tertiary hover:text-text-secondary"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
