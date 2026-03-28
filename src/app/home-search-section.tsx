"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { cn, matchesName } from "@/lib/utils";
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
      result = result.filter((c) => matchesName(c.name, searchQuery));
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
    const elementOrder = ["純粋", "冷静", "狂気", "活発", "憂鬱"];
    const rarityOrder = ["★3", "★2", "★1"];
    return result.sort((a, b) => {
      const ai = elementOrder.indexOf(a.element ?? "");
      const bi = elementOrder.indexOf(b.element ?? "");
      const elemDiff = (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      if (elemDiff !== 0) return elemDiff;
      const ra = rarityOrder.indexOf(a.rarity ?? "");
      const rb = rarityOrder.indexOf(b.rarity ?? "");
      return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
    });
  }, [characters, searchQuery, elementFilters, typeFilters, positionFilters, raceFilters, rarityFilters]);

  const hasAnyFilter = searchQuery.trim().length > 0 || elementFilters.size > 0 || typeFilters.size > 0 || positionFilters.size > 0 || raceFilters.size > 0 || rarityFilters.size > 0;

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
      <div className="rounded-[14px] bg-bg-card-alpha border border-border-primary p-3 space-y-2">
        {/* PC: 検索 + 性格 + レア を1行目 */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          {/* テキスト検索 + モバイルクリア */}
          <div className="flex items-center gap-2 lg:w-56">
            <div className="relative flex-1 lg:flex-none lg:w-full">
              <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="キャラ名で検索..."
                className="w-full rounded-[10px] bg-bg-input border border-border-primary pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-[rgba(249,168,212,0.3)] focus:outline-none"
              />
            </div>
            <button
              onClick={clearAll}
              className={cn(
                "shrink-0 rounded-[10px] bg-bg-input border px-2.5 py-1.5 text-[11px] font-bold transition-colors lg:hidden",
                hasAnyFilter
                  ? "border-[rgba(255,99,126,0.4)] text-[#fda4af] hover:text-white"
                  : "border-border-primary text-text-muted"
              )}
            >
              クリア
            </button>
          </div>

          {/* 性格フィルター */}
          <div className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-[10px] font-bold text-text-muted lg:hidden">性格</span>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
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
                        : "bg-bg-input"
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
            </div>
          </div>

          {/* レアリティフィルター */}
          <div className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-[10px] font-bold text-text-muted lg:hidden">レア</span>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {RARITIES.map((rarity) => {
                const active = rarityFilters.has(rarity);
                const starCount = parseInt(rarity.replace(/[^0-9]/g, "")) || 0;
                return (
                  <button
                    key={rarity}
                    onClick={() => toggleFilter(rarityFilters, rarity, setRarityFilters)}
                    className={cn(
                      "flex shrink-0 items-center gap-0.5 rounded-[10px] px-2.5 py-1 text-xs font-bold transition-colors",
                      active
                        ? "bg-[rgba(255,99,126,0.15)] text-[#fda4af] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                        : "bg-bg-input text-text-tertiary"
                    )}
                    style={{
                      border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
                    }}
                  >
                    <span className="text-[#fcd34d]">{"★".repeat(starCount)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* クリアボタン（右寄せ） */}
          <button
            onClick={clearAll}
            className={cn(
              "shrink-0 rounded-[10px] bg-bg-input border px-2.5 py-1.5 text-[11px] font-bold transition-colors hidden lg:block lg:ml-auto",
              hasAnyFilter
                ? "border-[rgba(255,99,126,0.4)] text-[#fda4af] hover:text-white"
                : "border-border-primary text-text-muted"
            )}
          >
            クリア
          </button>
        </div>

        {/* PC: タイプ + 配置 + 種族 を2行目 */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          {/* タイプ + 配置フィルター */}
          <div className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-[10px] font-bold text-text-muted lg:hidden">タイプ</span>
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
                        : "bg-bg-input"
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
              <div className="mx-1.5 h-5 shrink-0" style={{ width: "1px", backgroundColor: "rgba(139,122,171,0.4)" }} />
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
                        : "bg-bg-input"
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
          <div className="flex items-center gap-1.5">
            <span className="w-8 shrink-0 text-[10px] font-bold text-text-muted lg:hidden">種族</span>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {RACES.map((race) => (
                <ToggleButton
                  key={race}
                  label={race}
                  active={raceFilters.has(race)}
                  onClick={() => toggleFilter(raceFilters, race, setRaceFilters)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 結果 */}
      {hasAnyFilter ? (
        <>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-text-muted">
              {filtered.length}件のキャラクター
            </span>
          </div>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              該当するキャラクターが見つかりません
            </p>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
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
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-[14px] border border-dashed border-[rgba(139,122,171,0.3)] py-6">
          <svg className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm font-medium text-text-tertiary">
            性格やタイプを選択してキャラクターを探そう
          </p>
          <p className="text-[11px] text-text-muted">
            全{characters.length}体のキャラクターから絞り込めます
          </p>
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-8 shrink-0 text-[10px] font-bold text-text-muted">{label}</span>
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
          : "bg-bg-input text-text-tertiary"
      )}
      style={{
        border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
      }}
    >
      {label}
    </button>
  );
}
