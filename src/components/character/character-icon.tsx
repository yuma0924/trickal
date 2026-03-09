import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Element } from "@/lib/constants";

type IconSize = "sm" | "md" | "lg";

interface CharacterIconProps {
  name: string;
  imageUrl: string | null;
  element?: Element;
  isHidden?: boolean;
  size?: IconSize;
  className?: string;
}

const ELEMENT_BORDER: Record<Element, string> = {
  火: "border-element-fire",
  水: "border-element-water",
  風: "border-element-wind",
  光: "border-element-light",
  闇: "border-element-dark",
};

const ELEMENT_GLOW: Record<Element, string> = {
  火: "shadow-[0_0_8px_rgba(239,68,68,0.2)]",
  水: "shadow-[0_0_8px_rgba(59,130,246,0.2)]",
  風: "shadow-[0_0_8px_rgba(34,197,94,0.2)]",
  光: "shadow-[0_0_8px_rgba(234,179,8,0.2)]",
  闇: "shadow-[0_0_8px_rgba(168,85,247,0.2)]",
};

const sizeMap: Record<IconSize, { container: string; image: number }> = {
  sm: { container: "h-12 w-12", image: 48 },
  md: { container: "h-16 w-16", image: 64 },
  lg: { container: "h-24 w-24", image: 96 },
};

export function CharacterIcon({
  name,
  imageUrl,
  element,
  isHidden = false,
  size = "md",
  className,
}: CharacterIconProps) {
  const { container, image: imageSize } = sizeMap[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2",
        element ? ELEMENT_BORDER[element] : "border-border-primary",
        element && ELEMENT_GLOW[element],
        isHidden && "opacity-40 grayscale",
        container,
        className
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={imageSize}
          height={imageSize}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-tertiary">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}
