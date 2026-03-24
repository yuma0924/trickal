import Image from "next/image";
import { cn } from "@/lib/utils";

type IconSize = "sm" | "md" | "lg";

interface CharacterIconProps {
  name: string;
  imageUrl: string | null;
  isHidden?: boolean;
  size?: IconSize;
  className?: string;
}

const sizeMap: Record<IconSize, { container: string; image: number }> = {
  sm: { container: "h-12 w-12", image: 48 },
  md: { container: "h-16 w-16", image: 64 },
  lg: { container: "h-24 w-24", image: 96 },
};

export function CharacterIcon({
  name,
  imageUrl,
  isHidden = false,
  size = "md",
  className,
}: CharacterIconProps) {
  const { container, image: imageSize } = sizeMap[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden",
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
          className="pointer-events-none h-full w-full object-cover"
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
