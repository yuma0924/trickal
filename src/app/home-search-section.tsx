"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ELEMENTS } from "@/lib/constants";
import { CharacterCard } from "@/components/character/character-card";

interface SearchCharacter {
  id: string;
  slug: string;
  name: string;
  element: string | null;
  role: string | null;
  rarity: string | null;
  race: string | null;
  position: string | null;
  imageUrl: string | null;
}

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

const TYPES: { value: string; icon: string }[] = [
  { value: "支援", icon: "/icons/support.png" },
  { value: "攻撃", icon: "/icons/attack.png" },
  { value: "守備", icon: "/icons/defense.png" },
];
const POSITIONS: { value: string; icon: string }[] = [
  { value: "後列", icon: "/icons/back.png" },
  { value: "中列", icon: "/icons/middle.png" },
  { value: "前列", icon: "/icons/front.png" },
];
const RACES = ["妖精", "獣人", "エルフ", "精霊", "幽霊", "竜族", "魔女", "???"];
const RARITIES = ["★1", "★2", "★3"];

interface HomeSearchSectionProps {
  characters: SearchCharacter[];
}

export function HomeSearchSection({ characters }: HomeSearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [elementFilters, setElementFilters] = useState<Set<string>>(new Set());
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [positionFilters, setPositionFilters] = useState<Set<string>>(new Set());
  const [raceFilters, setRaceFilters] = useState<Set<string>>(new Set());
  const [rarityFilters, setRarityFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const filtered = useMemo(() => {
    let result = characters;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (elementFilters.size > 0) {
      result = result.filter((c) => c.element && elementFilters.has(c.element));
    }
    if (typeFilters.size > 0) {
      result = result.filter((c) => c.role && typeFilters.has(c.role));
    }
    if (positionFilters.size > 0) {
      result = result.filter((c) => c.position && positionFilters.has(c.position));
    }
    if (raceFilters.size > 0) {
      result = result.filter((c) => c.race && raceFilters.has(c.race));
    }
    if (rarityFilters.size > 0) {
      result = result.filter((c) => c.rarity && rarityFilters.has(c.rarity));
    }
    return result;
  }, [characters, searchQuery, elementFilters, typeFilters, positionFilters, raceFilters, rarityFilters]);

  const hasAnyFilter = searchQuery.trim() || elementFilters.size > 0 || typeFilters.size > 0 || positionFilters.size > 0 || raceFilters.size > 0 || rarityFilters.size > 0;

  const clearAll = () => {
    setSearchQuery("");
    setElementFilters(new Set());
    setTypeFilters(new Set());
    setPositionFilters(new Set());
    setRaceFilters(new Set());
    setRarityFilters(new Set());
  };

  return (
    <div className="space-y-3">
      {/* フィルターパネル */}
      <div className="rounded-[14px] bg-[rgba(36,27,53,0.8)] border border-[rgba(249,168,212,0.1)] p-3 space-y-2">
        {/* テキスト検索 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b7aab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="キャラ名で検索..."
              className="w-full rounded-[10px] bg-[#1a1225] border border-[rgba(249,168,212,0.1)] pl-8 pr-3 py-1.5 text-xs text-[#faf5ff] placeholder:text-[#8b7aab] focus:border-[rgba(249,168,212,0.3)] focus:outline-none"
            />
          </div>
          {hasAnyFilter && (
            <button
              onClick={clearAll}
              className="shrink-0 rounded-[10px] bg-[#1a1225] border border-[rgba(249,168,212,0.1)] px-2.5 py-1.5 text-[11px] font-bold text-[#8b7aab] transition-colors hover:text-[#fda4af]"
            >
              クリア
            </button>
          )}
        </div>

        {/* 属性フィルター */}
        <FilterRow label="属性">
          {ELEMENTS.map((elem) => {
            const active = elementFilters.has(elem);
            return (
              <button
                key={elem}
                onClick={() => toggleFilter(elementFilters, elem, setElementFilters)}
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-[10px] p-1.5 transition-colors",
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
                  className="h-5 w-5"
                />
              </button>
            );
          })}
        </FilterRow>

        {/* タイプ + 配置フィルター */}
        <div className="flex items-center gap-1.5">
          <span className="w-8 shrink-0 text-[10px] font-bold text-[#6b5a80]">タイプ</span>
          <div className="flex items-center gap-1.5">
            {TYPES.map((type) => {
              const active = typeFilters.has(type.value);
              return (
                <button
                  key={type.value}
                  onClick={() => toggleFilter(typeFilters, type.value, setTypeFilters)}
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-[10px] p-1.5 transition-colors",
                    active
                      ? "bg-[rgba(255,99,126,0.15)] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                      : "bg-[#1a1225]"
                  )}
                  style={{
                    border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
                  }}
                  title={type.value}
                >
                  <Image
                    src={type.icon}
                    alt={type.value}
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </button>
              );
            })}
            <div className="mx-2.5 h-5 shrink-0" style={{ width: "1px", backgroundColor: "rgba(139,122,171,0.4)" }} />
            {POSITIONS.map((pos) => {
              const active = positionFilters.has(pos.value);
              return (
                <button
                  key={pos.value}
                  onClick={() => toggleFilter(positionFilters, pos.value, setPositionFilters)}
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-[10px] p-1.5 transition-colors",
                    active
                      ? "bg-[rgba(255,99,126,0.15)] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                      : "bg-[#1a1225]"
                  )}
                  style={{
                    border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
                  }}
                  title={pos.value}
                >
                  <Image
                    src={pos.icon}
                    alt={pos.value}
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 種族フィルター */}
        <FilterRow label="種族">
          {RACES.map((race) => (
            <ToggleButton
              key={race}
              label={race}
              active={raceFilters.has(race)}
              onClick={() => toggleFilter(raceFilters, race, setRaceFilters)}
            />
          ))}
        </FilterRow>

        {/* レアリティフィルター */}
        <FilterRow label="レア">
          {RARITIES.map((rarity) => (
            <ToggleButton
              key={rarity}
              label={rarity}
              active={rarityFilters.has(rarity)}
              onClick={() => toggleFilter(rarityFilters, rarity, setRarityFilters)}
            />
          ))}
        </FilterRow>
      </div>

      {/* 結果件数 */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[#8b7aab]">
          {filtered.length}件のキャラクター
        </span>
      </div>

      {/* 結果グリッド */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8b7aab]">
          該当するキャラクターが見つかりません
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {filtered.map((char) => (
            <CharacterCard
              key={char.id}
              slug={char.slug}
              name={char.name}
              imageUrl={char.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-8 shrink-0 text-[10px] font-bold text-[#6b5a80]">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {children}
      </div>
    </div>
  );
}

function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[10px] px-2.5 py-1 text-[11px] font-bold transition-colors",
        active
          ? "bg-[rgba(255,99,126,0.15)] text-[#fda4af] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
          : "bg-[#1a1225] text-[#a893c0]"
      )}
      style={{
        border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
      }}
    >
      {label}
    </button>
  );
}
