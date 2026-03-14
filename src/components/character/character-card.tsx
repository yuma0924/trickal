import Link from "next/link";
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
    <Link
      href={`/characters/${slug}`}
      className={cn(
        "flex flex-col overflow-clip bg-[#241b35] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer",
        className
      )}
    >
      <div className="relative">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={82}
            height={82}
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-[#2a1f3d] text-sm text-[#8b7aab]">
            {name.charAt(0)}
          </div>
        )}
        {/* 順位バッジ (左上) */}
        {rankDisplay && (
          <div
            className="absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full shadow-[0px_10px_15px_rgba(0,0,0,0.1)]"
            style={{
              backgroundColor: "rgba(42,31,61,0.9)",
              border: "1.2px solid rgba(249,168,212,0.1)",
            }}
          >
            <span className="text-[10px] font-bold text-[#a893c0]">{rank}</span>
          </div>
        )}
        {/* ★評価オーバーレイ (左下) */}
        {avgRating !== null && avgRating !== undefined && (
          <div
            className="absolute bottom-1 left-0.5 flex items-center gap-0.5 rounded-[10px] py-[1px] pl-[5px] pr-[1px] shadow-[0px_10px_15px_rgba(0,0,0,0.1)]"
            style={{
              backgroundColor: "rgba(26,18,37,0.9)",
              border: "1.2px solid rgba(249,168,212,0.1)",
            }}
          >
            <svg className="h-2.5 w-2.5 text-[#fcd34d]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="-translate-y-px text-[10px] font-bold leading-none text-[#fcd34d]">
              {avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <div className="bg-[rgba(36,27,53,0.95)] px-1 py-1.5">
        <p className="truncate text-center text-[9px] font-bold leading-tight text-[#fce7f3]">
          {name}
        </p>
      </div>
    </Link>
  );
}
