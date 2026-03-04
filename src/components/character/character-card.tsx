import Link from "next/link";
import { cn } from "@/lib/utils";
import { CharacterIcon } from "@/components/character/character-icon";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import type { Element } from "@/lib/constants";

interface CharacterCardProps {
  slug: string;
  name: string;
  imageUrl: string | null;
  element?: Element;
  avgRating?: number | null;
  validVotesCount?: number;
  rank?: number | null;
  isHero?: boolean;
  className?: string;
}

export function CharacterCard({
  slug,
  name,
  imageUrl,
  element,
  avgRating,
  validVotesCount = 0,
  rank,
  isHero = false,
  className,
}: CharacterCardProps) {
  const rankDisplay = rank !== null && rank !== undefined;

  return (
    <Link
      href={`/characters/${slug}`}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-2xl border border-border-primary bg-bg-card p-2 transition-all cursor-pointer overflow-hidden",
        "hover:bg-bg-card-hover hover:scale-[1.02]",
        isHero && "p-3",
        className
      )}
    >
      <div className="relative">
        <CharacterIcon
          name={name}
          imageUrl={imageUrl}
          element={element}
          size={isHero ? "lg" : "md"}
        />
        {rankDisplay && (
          <div
            className={cn(
              "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
              rank === 1 && "bg-yellow-500 text-black",
              rank === 2 && "bg-gray-300 text-black",
              rank === 3 && "bg-amber-700 text-white",
              rank !== undefined && rank > 3 && "bg-bg-tertiary text-text-secondary"
            )}
          >
            {rank}
          </div>
        )}
      </div>
      <span
        className={cn(
          "line-clamp-1 text-center font-medium text-text-primary",
          isHero ? "text-sm" : "text-xs"
        )}
      >
        {name}
      </span>
      {avgRating !== null && avgRating !== undefined ? (
        <StarRatingDisplay
          rating={avgRating}
          size="sm"
          showValue
        />
      ) : (
        <span className="text-[10px] text-text-tertiary">未評価</span>
      )}
      {validVotesCount > 0 && (
        <Badge variant="outline" className="text-[10px]">
          {validVotesCount}票
        </Badge>
      )}
    </Link>
  );
}
