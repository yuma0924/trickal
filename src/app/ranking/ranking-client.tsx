"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tab } from "@/components/ui/tab";
import { CharacterCard } from "@/components/character/character-card";
import { Button } from "@/components/ui/button";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { ELEMENTS } from "@/lib/constants";
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
      ? filteredRanked[0]
      : null;

  return (
    <div className="space-y-6">
      {/* 属性フィルター */}
      <Tab items={elementTabs} value={elementFilter} onChange={handleFilterChange} />

      {/* 1位アナウンス */}
      {currentTop && (
        <div className="rounded-2xl bg-bg-card border border-border-primary p-3 text-center">
          <span className="text-xs text-text-muted">
            現在の{elementFilter === "all" ? "全属性" : elementFilter}の1位は{" "}
          </span>
          <span className="text-xs font-bold text-text-primary">{currentTop.name}</span>
        </div>
      )}

      {/* ランキンググリッド (4列) */}
      {filteredRanked.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-tertiary">
          該当するキャラクターがいません
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
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

      {/* 話題のキャラクター（直近24時間） */}
      {trendingCharacters.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ backgroundImage: "linear-gradient(135deg, #fb64b6, #ff8904)" }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </span>
                <h2 className="text-base font-bold text-[#faf5ff]">
                  話題のキャラクター
                </h2>
              </div>
              <span className="text-xs text-[#8b7aab]">直近24時間</span>
            </div>
            <p className="text-xs text-[#a893c0]">今注目されているキャラクターをチェック！</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex flex-col overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] transition-colors hover:bg-[rgba(36,27,53,0.7)] cursor-pointer"
              >
                <div className="flex items-center gap-2 p-2">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border border-border-primary">
                    {char.imageUrl ? (
                      <Image
                        src={char.imageUrl}
                        alt={char.name}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-tertiary">
                        {char.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-bold text-[#fce7f3]">
                      {char.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      {char.avgRating !== null && char.validVotesCount >= 4 ? (
                        <StarRatingDisplay rating={char.avgRating} size="sm" showValue />
                      ) : (
                        <span className="text-[8px] text-[#8b7aab]">
                          {char.validVotesCount > 0 ? `${char.validVotesCount}票` : "未評価"}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <span className="inline-flex items-center gap-0.5 rounded bg-[rgba(246,51,154,0.8)] px-1 py-0.5 text-[7px] font-bold text-white">
                        <svg className="h-1.5 w-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        +{char.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
                {char.latestComment && (
                  <div className="mx-1.5 mb-1.5 rounded-[10px] bg-[rgba(30,21,48,0.8)] border border-[rgba(249,168,212,0.05)] px-2.5 py-2">
                    <p className="line-clamp-2 text-[9px] leading-relaxed text-[rgba(252,231,243,0.8)]">
                      {char.latestComment}
                    </p>
                    {char.latestCommentAuthor && (
                      <p className="mt-1 text-[8px] text-[#8b7aab]">
                        — {char.latestCommentAuthor}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 票が少ないキャラ */}
      {filteredUnranked.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              票が少ないキャラ（順位対象外）
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              票が少ないため順位対象外
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
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

      {/* 他のランキングもチェック */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-[#a893c0]">他のランキングもチェック</p>
        <Link
          href="/builds"
          className="flex items-center gap-3 rounded-[14px] bg-gradient-to-r from-[rgba(251,100,182,0.15)] to-[rgba(255,99,126,0.15)] border border-[rgba(249,168,212,0.1)] px-4 py-3 transition-colors hover:from-[rgba(251,100,182,0.25)] hover:to-[rgba(255,99,126,0.25)] cursor-pointer"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
            style={{ backgroundImage: "linear-gradient(135deg, #fb64b6, #ff637e)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </span>
          <div className="flex-1">
            <span className="block text-sm font-bold text-[#fce7f3]">編成ランキング</span>
            <span className="text-[10px] text-[#8b7aab]">人気のパーティ編成をチェックしよう</span>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[#8b7aab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/stats"
          className="flex items-center gap-3 rounded-[14px] bg-gradient-to-r from-[rgba(0,188,255,0.15)] to-[rgba(166,132,255,0.15)] border border-[rgba(249,168,212,0.1)] px-4 py-3 transition-colors hover:from-[rgba(0,188,255,0.25)] hover:to-[rgba(166,132,255,0.25)] cursor-pointer"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
            style={{ backgroundImage: "linear-gradient(135deg, #00bcff, #a684ff)" }}
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17V9m4 8V5m4 12v-4" />
            </svg>
          </span>
          <div className="flex-1">
            <span className="block text-sm font-bold text-[#fce7f3]">ステータス別ランキング</span>
            <span className="text-[10px] text-[#8b7aab]">ステータスで比較して最強キャラを見つけよう</span>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[#8b7aab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
