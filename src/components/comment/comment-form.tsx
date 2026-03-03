"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StarRatingInput } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  onSubmit: (data: {
    displayName: string;
    rating: number | null;
    body: string;
  }) => void;
  showRating?: boolean;
  loading?: boolean;
  className?: string;
}

const MAX_CHARS = 300;
const MAX_LINES = 8;

export function CommentForm({
  onSubmit,
  showRating = true,
  loading = false,
  className,
}: CommentFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");

  const lineCount = body.split("\n").length;
  const isOverLimit = body.length > MAX_CHARS || lineCount > MAX_LINES;
  const canSubmit = body.trim().length > 0 && !isOverLimit && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      displayName: displayName.trim() || "名無しの教主",
      rating,
      body: body.trim(),
    });
    setBody("");
    setRating(null);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const lines = value.split("\n");
    if (lines.length <= MAX_LINES) {
      setBody(value);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("rounded-lg bg-bg-card p-4 space-y-3", className)}
    >
      <div>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="名無しの教主"
          maxLength={20}
          className="w-full rounded-md bg-bg-input border border-border-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {showRating && (
        <div>
          <label className="mb-1 block text-xs text-text-secondary">
            評価（任意）
          </label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>
      )}

      <div>
        <textarea
          value={body}
          onChange={handleBodyChange}
          placeholder="コメントを入力..."
          rows={4}
          maxLength={MAX_CHARS}
          className="w-full resize-none rounded-md bg-bg-input border border-border-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <div className="mt-1 flex justify-end text-[10px] text-text-tertiary">
          <span className={isOverLimit ? "text-thumbs-down" : ""}>
            {body.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {loading ? "送信中..." : rating !== null ? "投票する" : "コメントする"}
      </Button>
    </form>
  );
}
