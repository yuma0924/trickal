import Image from "next/image";
import { cn } from "@/lib/utils";

interface CharacterCardProps {
  slug: string;
  name: string;
  imageUrl: string | null;
  avgRating?: number | null;
  validVotesCount?: number;
  rank?: number | null;
  className?: string;
}

export function CharacterCard({
  slug,
  name,
  imageUrl,
  avgRating,
  validVotesCount = 0,
  rank,
  className,
}: CharacterCardProps) {
  const rankDisplay = rank !== null && rank !== undefined;

  return (
    <a
      href={`/characters/${slug}`}
      className={cn(
        "flex flex-col overflow-clip bg-bg-card shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer",
        className
      )}
    >
      <div className="relative">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={164}
            height={164}
            className="aspect-square w-full object-cover"
            sizes="(max-width: 768px) 25vw, 14vw"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-bg-tertiary text-sm text-text-muted">
            {name.charAt(0)}
          </div>
        )}
        {/* 順位バッジ (左上) */}
        {rankDisplay && rank === 1 && (
          <div className="absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-bg-card-alpha drop-shadow-md text-star">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" fill="currentColor" />
              <path d="M5 18h14v2H5z" fill="currentColor" />
            </svg>
          </div>
        )}
        {rankDisplay && rank === 2 && (
          <div className="absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-bg-card-alpha drop-shadow-md text-star">
            <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
              <path d="M13 22l-4 6h14l-4-6" fill="#7a8fa3" />
              <circle cx="16" cy="14" r="10" fill="#b0c4d8" stroke="#90a1b9" strokeWidth="1.5" />
              <path d="M16 8l1.8 3.6 4 .6-2.9 2.8.7 4L16 17l-3.6 2 .7-4-2.9-2.8 4-.6L16 8z" fill="#e8eef4" stroke="#90a1b9" strokeWidth="0.5" />
            </svg>
          </div>
        )}
        {rankDisplay && rank === 3 && (
          <div className="absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-bg-card-alpha drop-shadow-md text-star">
            <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
              <path d="M13 22l-4 6h14l-4-6" fill="#92400e" />
              <circle cx="16" cy="14" r="10" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
              <path d="M16 8l1.8 3.6 4 .6-2.9 2.8.7 4L16 17l-3.6 2 .7-4-2.9-2.8 4-.6L16 8z" fill="#fde68a" stroke="#b45309" strokeWidth="0.5" />
            </svg>
          </div>
        )}
        {rankDisplay && rank !== null && rank !== undefined && rank > 3 && (
          <div
            className="absolute left-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full shadow-[0px_10px_15px_rgba(0,0,0,0.1)] bg-bg-card-alpha border border-border-primary"
          >
            <span className="text-[10px] md:text-xs font-bold text-text-tertiary">{rank}</span>
          </div>
        )}
        {/* ★評価オーバーレイ (左下) */}
        {avgRating !== null && avgRating !== undefined && (
          <div
            className="absolute bottom-1 left-0.5 flex items-center justify-center gap-0.5 rounded-[10px] px-1.5 py-[1px] shadow-[0px_10px_15px_rgba(0,0,0,0.1)] bg-bg-card-alpha border border-border-primary"
          >
            <svg className="h-3 w-3 text-star" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="-translate-y-px text-[11px] md:text-xs font-bold leading-none text-star">
              {avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <div className="bg-bg-card-alpha-heavy px-1 py-1.5">
        <p className="truncate text-center text-[11px] md:text-xs font-bold leading-tight text-text-primary">
          {name}
        </p>
      </div>
    </a>
  );
}
