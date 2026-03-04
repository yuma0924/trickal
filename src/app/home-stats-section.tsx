"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Tab } from "@/components/ui/tab";
import { CharacterIcon } from "@/components/character/character-icon";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import type { Element } from "@/lib/constants";

interface StatsCharacter {
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

const STAT_TABS = [
  { value: "hp", label: "HP" },
  { value: "patk", label: "物攻" },
  { value: "matk", label: "魔攻" },
  { value: "def", label: "防御" },
  { value: "spd", label: "速度" },
  { value: "crit", label: "クリ" },
];

const PREVIEW_COUNT = 10;

interface HomeStatsSectionProps {
  characters: StatsCharacter[];
}

export function HomeStatsSection({ characters }: HomeStatsSectionProps) {
  const [selectedStat, setSelectedStat] = useState("hp");
  const [searchQuery, setSearchQuery] = useState("");

  const sorted = useMemo(() => {
    let filtered = characters;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    return [...filtered]
      .sort((a, b) => {
        const aVal = a.stats[selectedStat];
        const bVal = b.stats[selectedStat];
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        return bVal - aVal;
      })
      .slice(0, PREVIEW_COUNT);
  }, [characters, selectedStat, searchQuery]);

  return (
    <div className="space-y-3">
      {/* 検索 */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="キャラ名で検索..."
        className="w-full rounded-2xl bg-bg-input border border-border-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
      />

      {/* ステータスタブ */}
      <Tab items={STAT_TABS} value={selectedStat} onChange={setSelectedStat} />

      {/* リスト */}
      <div className="space-y-1">
        {sorted.map((char, index) => {
          const statValue = char.stats[selectedStat];
          return (
            <Link
              key={char.id}
              href={`/characters/${char.slug}`}
              className="flex items-center gap-2 rounded-2xl bg-bg-card border border-border-primary px-3 py-2 transition-colors hover:bg-bg-card-hover cursor-pointer"
            >
              <span className="w-6 text-center text-xs font-bold text-text-tertiary">
                {index + 1}
              </span>
              <CharacterIcon
                name={char.name}
                imageUrl={char.imageUrl}
                element={char.element as Element | undefined}
                size="sm"
              />
              <span className="flex-1 truncate text-sm font-medium text-text-primary">
                {char.name}
              </span>
              <span className="w-14 text-right text-sm font-bold text-text-primary">
                {statValue !== null ? statValue.toLocaleString() : "-"}
              </span>
              <div className="w-16 text-right">
                {char.avgRating !== null && char.validVotesCount >= 4 ? (
                  <StarRatingDisplay
                    rating={char.avgRating}
                    size="sm"
                    showValue
                  />
                ) : (
                  <span className="text-[10px] text-text-tertiary">-</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
