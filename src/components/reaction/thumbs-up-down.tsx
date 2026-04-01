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
    <div className={cn("inline-flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => handleClick("up")}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer",
          userReaction === "up"
            ? "border-thumbs-up/30 bg-thumbs-up/10 text-thumbs-up font-medium"
            : "border-border-primary text-text-muted hover:text-thumbs-up hover:border-thumbs-up/20 hover:bg-thumbs-up/5"
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
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer",
          userReaction === "down"
            ? "border-thumbs-down/30 bg-thumbs-down/10 text-thumbs-down font-medium"
            : "border-border-primary text-text-muted hover:text-thumbs-down hover:border-thumbs-down/20 hover:bg-thumbs-down/5"
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
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
    </svg>
  );
}

function ThumbsDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V6.17C17 4.95 15.95 4 14.66 4H6.55c-.7 0-1.36.37-1.72.97l-2.66 6.15z" />
    </svg>
  );
}
