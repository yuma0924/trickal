"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { CharacterCard } from "@/components/character/character-card";
import { Button } from "@/components/ui/button";
import { ELEMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RankedCharacter, UnrankedCharacter, TrendingCharacter } from "./page";

const ELEMENT_ICON_MAP: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

interface RankingClientProps {
  rankedCharacters: RankedCharacter[];
  unrankedCharacters: UnrankedCharacter[];
  trendingCharacters: TrendingCharacter[];
}

const INITIAL_SHOW_COUNT = 30;
const LOAD_MORE_COUNT = 30;

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

export function RankingClient({
  rankedCharacters,
  unrankedCharacters,
  trendingCharacters,
}: RankingClientProps) {
  const [elementFilter, setElementFilter] = useState<string>("all");
  const [showCount, setShowCount] = useState(INITIAL_SHOW_COUNT);

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
    <div className="space-y-6 md:space-y-8">
      {/* 性格フィルター */}
      <div className="flex items-center gap-1.5 lg:gap-2">
        <button
          onClick={() => handleFilterChange("all")}
          className={cn(
            "shrink-0 rounded-[10px] px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer lg:px-3.5 lg:py-2 lg:text-sm",
            elementFilter === "all"
              ? "bg-[rgba(255,99,126,0.15)] text-[#fda4af] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
              : "bg-[#1a1225] text-[#a893c0]"
          )}
          style={{
            border: `1.2px solid ${elementFilter === "all" ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
          }}
        >
          全性格
        </button>
        {ELEMENTS.map((elem) => {
          const active = elementFilter === elem;
          return (
            <button
              key={elem}
              onClick={() => handleFilterChange(elem)}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-[10px] p-1.5 transition-colors cursor-pointer lg:p-2",
                active
                  ? "bg-[rgba(255,99,126,0.15)] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                  : "bg-[#1a1225]"
              )}
              style={{
                border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
              }}
              title={elem}
            >
              <Image
                src={ELEMENT_ICONS[elem]}
                alt={elem}
                width={20}
                height={20}
                className="h-5 w-5 lg:h-6 lg:w-6"
              />
            </button>
          );
        })}
      </div>

      {/* 1位アナウンス + 誘導（キャラがある時のみ） */}
      {filteredRanked.length > 0 && (
        <>
          <div className="-mt-3 flex items-stretch justify-between gap-4">
            {currentTop && (
              <Link
                href={`/characters/${currentTop.slug}`}
                className="inline-flex items-center rounded-2xl border border-[rgba(255,191,36,0.3)] bg-gradient-to-r from-[rgba(255,191,36,0.1)] to-[rgba(255,143,0,0.05)] px-5 py-3 transition-colors hover:from-[rgba(255,191,36,0.15)] cursor-pointer lg:pl-5 lg:pr-12"
              >
                <span className="text-base text-[#fafafa]">
                  現在の{elementFilter === "all" ? "総合" : elementFilter}1位は
                </span>
                <span className="ml-1.5 text-lg font-bold text-[#fafafa] lg:text-xl">
                  {currentTop.name}
                </span>
                {currentTop.avgRating !== null && (
                  <span className="ml-1.5 text-base font-bold text-[#fcd34d] lg:text-lg">
                    ★{currentTop.avgRating.toFixed(1)}
                  </span>
                )}
                <span className="ml-1.5 text-base text-[#fafafa]">
                  です
                </span>
              </Link>
            )}
            <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-[rgba(249,168,212,0.15)] bg-[rgba(42,33,62,0.5)] px-4 py-3">
              <svg className="h-4 w-4 shrink-0 text-[#f9a8d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span className="text-sm text-text-tertiary">キャラをクリックして<br />コメントや投票をしよう！</span>
            </div>
          </div>
          <div className="-mt-4 flex items-center gap-1.5 lg:hidden">
            <svg className="h-3.5 w-3.5 shrink-0 text-[#f9a8d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span className="text-xs md:text-sm text-text-tertiary">キャラをタップしてコメントや投票をしよう！</span>
          </div>
        </>
      )}

      {/* ランキンググリッド (4列) */}
      {filteredRanked.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-tertiary">
          該当するキャラクターがいません
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {visibleRanked.map((char) => (
              <CharacterCard
                key={char.id}
                slug={char.slug}
                name={char.name}
                imageUrl={char.imageUrl}

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

      {/* 票が少ないキャラ */}
      {filteredUnranked.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              票が少ないキャラ（順位対象外）
            </h2>
            <p className="mt-1 text-xs md:text-sm text-text-muted">
              票が少ないため順位対象外
            </p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {filteredUnranked.map((char) => (
              <CharacterCard
                key={char.id}
                slug={char.slug}
                name={char.name}
                imageUrl={char.imageUrl}

                avgRating={
                  char.validVotesCount > 0 ? char.avgRating : null
                }
                validVotesCount={char.validVotesCount}
              />
            ))}
          </div>
        </section>
      )}

      {/* 話題のキャラクター */}
      {trendingCharacters.length > 0 && (
        <section className="mt-12 space-y-4">
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
                <h2 className="text-base md:text-lg font-bold text-[#fafafa]">
                  話題のキャラクター
                </h2>
              </div>
              <span className="text-xs md:text-sm text-[#8b7aab]">最近の注目</span>
            </div>
            <p className="text-xs md:text-sm text-[#a893c0]">今注目されているキャラクターをチェック！</p>
          </div>
          <div className="-mx-4 grid grid-cols-2 md:grid-cols-3 gap-2 px-2">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex flex-col overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] transition-colors hover:bg-[rgba(36,27,53,0.7)] cursor-pointer"
              >
                <div className="flex items-center gap-2.5 p-2.5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    {char.imageUrl ? (
                      <Image
                        src={char.imageUrl}
                        alt={char.name}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#2a1f3d] text-sm text-[#8b7aab]">
                        {char.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm md:text-base font-bold text-[#fafafa]">
                        {char.name}
                      </p>
                      {char.element && ELEMENT_ICON_MAP[char.element] && (
                        <Image src={ELEMENT_ICON_MAP[char.element]} alt={char.element} width={16} height={16} className="shrink-0" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {char.avgRating !== null && char.validVotesCount >= 1 ? (
                        <span className="text-sm md:text-base font-bold text-[#fcd34d]">
                          ★{char.avgRating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs md:text-sm text-[#8b7aab]">
                          未評価
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 rounded bg-[rgba(246,51,154,0.8)] px-1.5 py-0.5 text-[10px] md:text-xs font-bold text-white">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        +{char.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
                {char.latestComment && (
                  <div className="mx-2 mb-2 flex flex-col rounded-[10px] bg-[rgba(42,33,62,0.8)] border border-[rgba(249,168,212,0.05)] px-2.5 py-2 min-h-[76px]">
                    <p className="line-clamp-2 text-[11px] md:text-xs leading-relaxed text-[#fafafa]">
                      {char.latestComment}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-1">
                      {char.latestCommentAuthor && (
                        <span className="text-[10px] md:text-xs text-[#8b7aab]">
                          — {char.latestCommentAuthor}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-[10px] md:text-xs text-thumbs-up">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                        </svg>
                        {char.latestCommentThumbsUp}
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 他のランキングもチェック */}
      <section className="space-y-3 lg:max-w-md">
        <p className="text-xs md:text-sm font-bold text-[#a893c0]">他のランキングもチェック</p>
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
            <span className="block text-sm md:text-base font-bold text-[#fafafa]">人気編成ランキング</span>
            <span className="text-xs md:text-sm text-[#8b7aab]">人気のパーティ編成をチェックしよう</span>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[#8b7aab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
