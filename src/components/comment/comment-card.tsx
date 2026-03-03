import { cn } from "@/lib/utils";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { ThumbsUpDown } from "@/components/reaction/thumbs-up-down";

type ReactionState = "up" | "down" | null;

interface CommentCardProps {
  id: string;
  commentType: "vote" | "board";
  displayName: string;
  body: string;
  rating?: number | null;
  thumbsUpCount: number;
  thumbsDownCount: number;
  createdAt: string;
  isLatestVote?: boolean;
  isDeleted?: boolean;
  userReaction?: ReactionState;
  onReact?: (commentId: string, reaction: ReactionState) => void;
  onReport?: (commentId: string) => void;
  className?: string;
}

function getKarmaClass(netScore: number): string {
  if (netScore >= 30) return "karma-gold";
  if (netScore >= 15) return "karma-bold";
  if (netScore <= -30) return "karma-very-dim";
  if (netScore <= -15) return "karma-dim";
  return "";
}

export function CommentCard({
  id,
  commentType,
  displayName,
  body,
  rating,
  thumbsUpCount,
  thumbsDownCount,
  createdAt,
  isDeleted = false,
  userReaction,
  onReact,
  onReport,
  className,
}: CommentCardProps) {
  const netScore = thumbsUpCount - thumbsDownCount;
  const karmaClass = getKarmaClass(netScore);

  if (isDeleted) {
    return (
      <div className={cn("rounded-lg bg-bg-card p-3 opacity-50", className)}>
        <p className="text-sm text-text-tertiary">このコメントは削除されました</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-bg-card p-3",
        karmaClass,
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">
          {displayName}
        </span>
        {commentType === "vote" && rating !== null && rating !== undefined && (
          <StarRatingDisplay rating={rating} size="sm" showValue={false} />
        )}
        <span className="ml-auto text-[10px] text-text-tertiary">
          {new Date(createdAt).toLocaleDateString("ja-JP")}
        </span>
      </div>

      <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
        {body}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <ThumbsUpDown
          thumbsUpCount={thumbsUpCount}
          thumbsDownCount={thumbsDownCount}
          userReaction={userReaction}
          onReact={onReact ? (reaction) => onReact(id, reaction) : undefined}
        />
        {onReport && (
          <button
            type="button"
            onClick={() => onReport(id)}
            className="text-[10px] text-text-muted hover:text-thumbs-down transition-colors cursor-pointer"
          >
            通報
          </button>
        )}
      </div>
    </div>
  );
}
