"use client";

import { cn } from "@/lib/utils";

type ReactionState = "up" | "down" | null;

interface ThumbsUpDownProps {
  thumbsUpCount: number;
  thumbsDownCount: number;
  userReaction?: ReactionState;
  onReact?: (reaction: ReactionState) => void;
  className?: string;
}

export function ThumbsUpDown({
  thumbsUpCount,
  thumbsDownCount,
  userReaction = null,
  onReact,
  className,
}: ThumbsUpDownProps) {
  const handleClick = (type: "up" | "down") => {
    if (!onReact) return;
    // 同じボタンをもう一度押したら取り消し
    if (userReaction === type) {
      onReact(null);
    } else {
      onReact(type);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={() => handleClick("up")}
        className={cn(
          "inline-flex items-center gap-1 text-xs transition-colors cursor-pointer",
          userReaction === "up"
            ? "text-thumbs-up"
            : "text-text-muted hover:text-thumbs-up"
        )}
        aria-label="いいね"
      >
        <ThumbsUpIcon className="h-3.5 w-3.5" />
        <span>{thumbsUpCount}</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick("down")}
        className={cn(
          "inline-flex items-center gap-1 text-xs transition-colors cursor-pointer",
          userReaction === "down"
            ? "text-thumbs-down"
            : "text-text-muted hover:text-thumbs-down"
        )}
        aria-label="よくない"
      >
        <ThumbsDownIcon className="h-3.5 w-3.5" />
        <span>{thumbsDownCount}</span>
      </button>
    </div>
  );
}

function ThumbsUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zm-9 11H4a2 2 0 01-2-2v-7a2 2 0 012-2h1"
      />
    </svg>
  );
}

function ThumbsDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zm9-13h1a2 2 0 012 2v7a2 2 0 01-2 2h-1"
      />
    </svg>
  );
}
