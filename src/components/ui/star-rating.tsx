"use client";

import { cn } from "@/lib/utils";
import { useId, useRef, useCallback } from "react";

interface StarRatingDisplayProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

const starSizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
  lg: "h-6 w-6",
};

function StarIcon({
  filled,
  half,
  className,
  gradientId,
}: {
  filled: boolean;
  half: boolean;
  className?: string;
  gradientId: string;
}) {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={`url(#${gradientId})`}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return (
    <svg className={cn(className, filled && "drop-shadow-[0_0_2px_rgba(251,191,36,0.3)]")} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function StarRatingDisplay({
  rating,
  size = "md",
  showValue = true,
  className,
}: StarRatingDisplayProps) {
  const instanceId = useId();
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i;
    const half = !filled && rating >= i - 0.5;
    stars.push(
      <StarIcon
        key={i}
        filled={filled}
        half={half}
        className={starSizeMap[size]}
        gradientId={`half-star-${instanceId}-${i}`}
      />
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      <span className="text-star flex items-center gap-0.5">{stars}</span>
      {showValue && (
        <span className={cn("ml-1 font-bold text-text-primary", sizeMap[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
}

export function StarRatingInput({
  value,
  onChange,
  className,
}: StarRatingInputProps) {
  const instanceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const calcValueFromPointer = useCallback((clientX: number): number => {
    const container = containerRef.current;
    if (!container) return 0.5;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const starWidth = rect.width / 5;
    const starIndex = Math.floor(x / starWidth);
    const withinStar = (x - starIndex * starWidth) / starWidth;
    const rating = starIndex + (withinStar < 0.5 ? 0.5 : 1);
    return Math.max(0.5, Math.min(5, rating));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const newValue = calcValueFromPointer(e.clientX);
    onChange(newValue);
  }, [calcValueFromPointer, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const newValue = calcValueFromPointer(e.clientX);
    onChange(newValue);
  }, [calcValueFromPointer, onChange]);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleClick = (starIndex: number, isLeftHalf: boolean) => {
    const newValue = isLeftHalf ? starIndex - 0.5 : starIndex;
    if (value === newValue) {
      onChange(null);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)} role="radiogroup" aria-label="評価">
      <div
        ref={containerRef}
        className="inline-flex touch-none items-center gap-1"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = value !== null && value >= starIndex;
          const half = !filled && value !== null && value >= starIndex - 0.5;
          return (
            <span key={starIndex} className="relative cursor-pointer text-star" role="radio" aria-checked={value === starIndex || value === starIndex - 0.5}>
              <StarIcon
                filled={filled}
                half={half}
                className="h-8 w-8"
                gradientId={`half-star-input-${instanceId}-${starIndex}`}
              />
              {/* 左半分 */}
              <button
                type="button"
                className="absolute inset-y-0 left-0 w-1/2"
                onClick={() => handleClick(starIndex, true)}
                aria-label={`${starIndex - 0.5}点`}
              />
              {/* 右半分 */}
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-1/2"
                onClick={() => handleClick(starIndex, false)}
                aria-label={`${starIndex}点`}
              />
            </span>
          );
        })}
      </div>
      {value !== null && (
        <span className="ml-2 text-sm font-bold text-text-primary">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
