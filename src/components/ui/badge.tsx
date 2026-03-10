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
  純粋: "bg-element-pure/20 text-element-pure",
  冷静: "bg-element-calm/20 text-element-calm",
  狂気: "bg-element-madness/20 text-element-madness",
  活発: "bg-element-lively/20 text-element-lively",
  憂鬱: "bg-element-melancholy/20 text-element-melancholy",
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
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium",
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
