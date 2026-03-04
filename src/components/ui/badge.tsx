import { cn } from "@/lib/utils";
import type { Element } from "@/lib/constants";

type BadgeVariant = "default" | "element" | "rank" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  element?: Element;
  className?: string;
}

const ELEMENT_BG: Record<Element, string> = {
  火: "bg-element-fire/20 text-element-fire",
  水: "bg-element-water/20 text-element-water",
  風: "bg-element-wind/20 text-element-wind",
  光: "bg-element-light/20 text-element-light",
  闇: "bg-element-dark/20 text-element-dark",
};

export function Badge({
  children,
  variant = "default",
  element,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-bg-tertiary/50 text-text-tertiary",
        variant === "element" && element && ELEMENT_BG[element],
        variant === "rank" && "bg-accent/20 text-accent font-bold",
        variant === "outline" &&
          "border border-border-primary text-text-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
