"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Tab } from "@/components/ui/tab";
import { CharacterIcon } from "@/components/character/character-icon";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ELEMENTS, type Element } from "@/lib/constants";

interface StatKeyInfo {
  key: string;
  label: string;
}

interface CharacterWithStats {
  id: string;
  slug: string;
  name: string;
  element: string | null;
  role: string | null;
  imageUrl: string | null;
  stats: Record<string, number | null>;
  avgRating: number | null;
  validVotesCount: number;
}

interface StatsRankingClientProps {
  characters: CharacterWithStats[];
  statKeys: StatKeyInfo[];
}

export function StatsRankingClient({
  characters,
  statKeys,
}: StatsRankingClientProps) {
  const [selectedStat, setSelectedStat] = useState(statKeys[0].key);
  const [searchQuery, setSearchQuery] = useState("");
  const [elementFilter, setElementFilter] = useState<string>("all");

  // タブアイテム
  const statTabs = statKeys.map((s) => ({ value: s.key, label: s.label }));

  // フィルタータブ
  const elementTabs = [
    { value: "all", label: "全属性" },
    ...ELEMENTS.map((e) => ({ value: e, label: e })),
  ];

  // ソート・フィルター済みキャラリスト
  const sortedCharacters = useMemo(() => {
    let filtered = characters;

    // 名前検索
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    // 属性フィルター
    if (elementFilter !== "all") {
      filtered = filtered.filter((c) => c.element === elementFilter);
    }

    // ステータス値でソート（null は最下位）
    return [...filtered].sort((a, b) => {
      const aVal = a.stats[selectedStat];
      const bVal = b.stats[selectedStat];

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return bVal - aVal;
    });
  }, [characters, selectedStat, searchQuery, elementFilter]);

  const selectedLabel =
    statKeys.find((s) => s.key === selectedStat)?.label ?? "";

  return (
    <div className="space-y-4">
      {/* ステータス切替タブ */}
      <Tab items={statTabs} value={selectedStat} onChange={setSelectedStat} />

      {/* 検索 + 属性フィルター */}
      <div className="space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="キャラ名で検索..."
          className="w-full rounded-lg bg-bg-input border border-border-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <Tab items={elementTabs} value={elementFilter} onChange={setElementFilter} />
      </div>

      {/* キャラリスト */}
      {sortedCharacters.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-tertiary">
          該当するキャラクターがいません
        </p>
      ) : (
        <div className="space-y-1">
          {/* ヘッダー */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-text-tertiary uppercase">
            <span className="w-8 text-center">#</span>
            <span className="flex-1">キャラクター</span>
            <span className="w-16 text-right">{selectedLabel}</span>
            <span className="w-20 text-right">評価</span>
          </div>

          {sortedCharacters.map((character, index) => {
            const statValue = character.stats[selectedStat];
            const rank = index + 1;

            return (
              <Link
                key={character.id}
                href={`/characters/${character.slug}`}
                className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-bg-card-hover cursor-pointer"
              >
                {/* 順位 */}
                <span
                  className={cn(
                    "w-8 text-center text-sm font-bold",
                    rank === 1 && "text-yellow-500",
                    rank === 2 && "text-gray-300",
                    rank === 3 && "text-amber-700",
                    rank > 3 && "text-text-tertiary"
                  )}
                >
                  {rank}
                </span>

                {/* キャラアイコン + 名前 */}
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <CharacterIcon
                    name={character.name}
                    imageUrl={character.imageUrl}
                    element={character.element as Element | undefined}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {character.name}
                    </span>
                    {character.element && (
                      <Badge
                        variant="element"
                        element={character.element as Element}
                        className="mt-0.5 text-[10px]"
                      >
                        {character.element}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* ステータス値 */}
                <span className="w-16 text-right text-sm font-bold text-text-primary">
                  {statValue !== null ? statValue.toLocaleString() : "未入力"}
                </span>

                {/* 評価 */}
                <div className="w-20 text-right">
                  {character.avgRating !== null && character.validVotesCount >= 4 ? (
                    <StarRatingDisplay
                      rating={character.avgRating}
                      size="sm"
                      showValue
                    />
                  ) : (
                    <span className="text-[10px] text-text-tertiary">
                      {character.validVotesCount > 0
                        ? `${character.validVotesCount}票`
                        : "未評価"}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
