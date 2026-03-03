"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  remaining: number;
  onLoadMore: () => void;
  loading?: boolean;
  className?: string;
}

export function Pagination({
  remaining,
  onLoadMore,
  loading = false,
  className,
}: PaginationProps) {
  if (remaining <= 0) return null;

  return (
    <div className={cn("flex justify-center py-4", className)}>
      <Button
        variant="secondary"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? "読み込み中..." : `さらに表示（残り${remaining}件）`}
      </Button>
    </div>
  );
}
