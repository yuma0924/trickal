"use client";

import { useState, useMemo } from "react";
import { Tab } from "@/components/ui/tab";
import { CharacterCard } from "@/components/character/character-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ELEMENTS } from "@/lib/constants";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import type { RankedCharacter, UnrankedCharacter, TrendingCharacter } from "./page";

interface RankingClientProps {
  rankedCharacters: RankedCharacter[];
  unrankedCharacters: UnrankedCharacter[];
  trendingCharacters: TrendingCharacter[];
}

const INITIAL_SHOW_COUNT = 30;
const LOAD_MORE_COUNT = 30;

export function RankingClient({
  rankedCharacters,
  unrankedCharacters,
  trendingCharacters,
}: RankingClientProps) {
  const [elementFilter, setElementFilter] = useState<string>("all");
  const [showCount, setShowCount] = useState(INITIAL_SHOW_COUNT);

  const elementTabs = [
    { value: "all", label: "全属性" },
    ...ELEMENTS.map((e) => ({ value: e, label: e })),
  ];

  // フィルター適用
  const filteredRanked = useMemo(() => {
    if (elementFilter === "all") return rankedCharacters;
    return rankedCharacters.filter((c) => c.element === elementFilter);
  }, [rankedCharacters, elementFilter]);

  const filteredUnranked = useMemo(() => {
    if (elementFilter === "all") return unrankedCharacters;
    return unrankedCharacters.filter((c) => c.element === elementFilter);
  }, [unrankedCharacters, elementFilter]);

  // 表示する分
  const visibleRanked = filteredRanked.slice(0, showCount);
  const remaining = filteredRanked.length - showCount;

  // フィルター変更時のリセット
  const handleFilterChange = (value: string) => {
    setElementFilter(value);
    setShowCount(INITIAL_SHOW_COUNT);
  };

  // 1位アナウンス
  const currentTop =
    filteredRanked.length > 0
      ? filteredRanked[0].name
      : null;

  return (
    <div className="space-y-6">
      {/* 属性フィルター */}
      <Tab items={elementTabs} value={elementFilter} onChange={handleFilterChange} />

      {/* 1位アナウンス */}
      {currentTop && (
        <div className="rounded-2xl bg-bg-card border border-border-primary p-3 text-center">
          <span className="text-sm text-text-secondary">
            現在の{elementFilter === "all" ? "全属性" : elementFilter}の1位は{" "}
          </span>
          <span className="text-sm font-bold text-accent">{currentTop}</span>
        </div>
      )}

      {/* ランキンググリッド */}
      {filteredRanked.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-tertiary">
          該当するキャラクターがいません
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {visibleRanked.map((char) => (
              <CharacterCard
                key={char.id}
                slug={char.slug}
                name={char.name}
                imageUrl={char.imageUrl}
                element={char.element ?? undefined}
                avgRating={char.avgRating}
                validVotesCount={char.validVotesCount}
                rank={char.rank}
                isHero={char.rank !== null && char.rank <= 3}
              />
            ))}
          </div>

          {remaining > 0 && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setShowCount((c) => c + LOAD_MORE_COUNT)}
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                さらに表示（残り{remaining}キャラ）
              </Button>
            </div>
          )}
        </>
      )}

      {/* 注目のキャラクター（直近24時間） */}
      {trendingCharacters.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                話題のキャラクター
              </h2>
              <p className="text-sm text-text-tertiary">今注目されているキャラクターをチェック！</p>
              <p className="text-xs text-text-muted">直近24時間</p>
            </div>
          </div>
          <div className="space-y-1">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex items-center gap-3 rounded-2xl bg-bg-card border border-border-primary px-3 py-2.5 transition-colors hover:bg-bg-card-hover cursor-pointer"
              >
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-border-primary">
                  {char.imageUrl ? (
                    <Image
                      src={char.imageUrl}
                      alt={char.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-tertiary">
                      {char.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {char.name}
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    {char.avgRating !== null && char.validVotesCount >= 4 ? (
                      <StarRatingDisplay rating={char.avgRating} size="sm" showValue />
                    ) : (
                      <span className="text-[10px] text-text-tertiary">
                        {char.validVotesCount > 0 ? `${char.validVotesCount}票` : "未評価"}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {char.commentCount}件
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 票が少ないキャラ */}
      {filteredUnranked.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                票が少ないキャラ（順位対象外）
              </h2>
              <p className="text-sm text-text-tertiary">
                票が少ないため順位対象外
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {filteredUnranked.map((char) => (
              <CharacterCard
                key={char.id}
                slug={char.slug}
                name={char.name}
                imageUrl={char.imageUrl}
                element={char.element ?? undefined}
                avgRating={
                  char.validVotesCount > 0 ? char.avgRating : null
                }
                validVotesCount={char.validVotesCount}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
