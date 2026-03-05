"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

const ELEMENT_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  火: { border: "rgba(251,113,133,0.6)", bg: "rgba(251,113,133,0.15)", text: "#fb7185" },
  水: { border: "rgba(56,189,248,0.6)", bg: "rgba(56,189,248,0.15)", text: "#38bdf8" },
  風: { border: "rgba(74,222,128,0.6)", bg: "rgba(74,222,128,0.15)", text: "#34d399" },
  光: { border: "rgba(255,210,48,0.6)", bg: "rgba(255,210,48,0.15)", text: "#fcd34d" },
  闇: { border: "rgba(166,132,255,0.6)", bg: "rgba(166,132,255,0.15)", text: "#a78bfa" },
};

const ROLES = ["アタッカー", "ヒーラー", "サポーター", "タンク"];

const PREVIEW_COUNT = 10;

interface HomeStatsSectionProps {
  characters: StatsCharacter[];
}

export function HomeStatsSection({ characters }: HomeStatsSectionProps) {
  const [selectedStat, setSelectedStat] = useState("hp");
  const [searchQuery, setSearchQuery] = useState("");
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [checkedOnly, setCheckedOnly] = useState(false);

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sorted = useMemo(() => {
    let filtered = characters;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (elementFilter) {
      filtered = filtered.filter((c) => c.element === elementFilter);
    }
    if (roleFilter) {
      filtered = filtered.filter((c) => c.role === roleFilter);
    }
    if (checkedOnly) {
      filtered = filtered.filter((c) => checkedIds.has(c.id));
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
  }, [characters, selectedStat, searchQuery, elementFilter, roleFilter, checkedOnly, checkedIds]);

  const selectedLabel = STAT_TABS.find((s) => s.value === selectedStat)?.label ?? "";

  return (
    <div className="space-y-3">
      {/* フィルターパネル */}
      <div className="rounded-[14px] bg-[rgba(36,27,53,0.8)] border border-[rgba(249,168,212,0.1)] p-3 space-y-2">
        {/* 検索 + ✓のみ */}
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
          <button
            onClick={() => setCheckedOnly(!checkedOnly)}
            className="flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-bold shrink-0 transition-colors"
            style={{
              backgroundColor: checkedOnly ? "rgba(255,99,126,0.15)" : "#1a1225",
              border: `1.2px solid ${checkedOnly ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
              color: checkedOnly ? "#fda4af" : "rgba(252,231,243,0.8)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "16px",
                height: "16px",
                minWidth: "16px",
                minHeight: "16px",
                borderRadius: "3px",
                backgroundColor: checkedOnly ? "rgba(255,99,126,0.3)" : "#2a1f3d",
                border: `1.5px solid ${checkedOnly ? "rgba(255,99,126,0.5)" : "rgba(249,168,212,0.2)"}`,
              }}
            >
              {checkedOnly && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fda4af" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            ✓のみ
          </button>
        </div>

        {/* 属性フィルター */}
        <div className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-[10px] font-bold text-[#6b5a80]">属性</span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {Object.entries(ELEMENT_STYLES).map(([elem, style]) => (
              <button
                key={elem}
                onClick={() => setElementFilter(elementFilter === elem ? null : elem)}
                className={cn(
                  "shrink-0 rounded-[10px] px-2.5 py-1 text-[11px] font-bold text-center transition-colors",
                  elementFilter === elem
                    ? "shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                    : "bg-[#1a1225]"
                )}
                style={{
                  border: `1.2px solid ${elementFilter === elem ? style.border : style.border.replace("0.6)", "0.3)")}`,
                  color: style.text,
                  ...(elementFilter === elem ? { backgroundColor: style.bg } : {}),
                }}
              >
                {elem}
              </button>
            ))}
          </div>
        </div>

        {/* 役割フィルター */}
        <div className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-[10px] font-bold text-[#6b5a80]">役割</span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(roleFilter === role ? null : role)}
                className={cn(
                  "shrink-0 rounded-[10px] px-2.5 py-1 text-[11px] font-bold transition-colors",
                  roleFilter === role
                    ? "bg-[rgba(255,99,126,0.15)] text-[#fda4af] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                    : "bg-[#1a1225] text-[#a893c0]"
                )}
                style={{
                  border: `1.2px solid ${roleFilter === role ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* 並替 (ステータスソート) */}
        <div className="flex items-center gap-1.5 border-t border-[rgba(249,168,212,0.1)] pt-2">
          <span className="w-5 text-[10px] font-bold text-[#6b5a80]">並替</span>
          <div className="flex gap-1.5">
            {STAT_TABS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStat(s.value)}
                className={cn(
                  "rounded-[8px] px-2 py-0.5 text-[11px] font-bold text-center transition-colors",
                  selectedStat === s.value
                    ? "bg-gradient-to-r from-[rgba(255,99,126,0.15)] to-[rgba(255,32,86,0.15)] text-[#fda4af] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                    : "bg-[#1a1225] text-[#a893c0]"
                )}
                style={{
                  border: `1.2px solid ${selectedStat === s.value ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
                }}
              >
                {s.label}{selectedStat === s.value ? "↓" : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* リスト */}
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8b7aab]">
          該当するキャラクターがいません
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((char) => {
            const statValue = char.stats[selectedStat];
            const elemStyle = char.element ? ELEMENT_STYLES[char.element] : null;

            return (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex items-center gap-2.5 rounded-[14px] bg-gradient-to-b from-[rgba(36,27,53,0.8)] to-[rgba(36,27,53,0.4)] px-3 py-2.5 transition-colors hover:from-[rgba(36,27,53,0.9)] hover:to-[rgba(36,27,53,0.6)] cursor-pointer"
                style={{ border: "1.2px solid rgba(249,168,212,0.1)" }}
              >
                {/* チェックボックス */}
                <span
                  role="checkbox"
                  aria-checked={checkedIds.has(char.id)}
                  onClick={(e) => toggleCheck(char.id, e)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "14px",
                    height: "14px",
                    minWidth: "14px",
                    minHeight: "14px",
                    borderRadius: "3px",
                    backgroundColor: checkedIds.has(char.id) ? "rgba(255,99,126,0.3)" : "#2a1f3d",
                    border: `1.5px solid ${checkedIds.has(char.id) ? "rgba(255,99,126,0.5)" : "rgba(249,168,212,0.2)"}`,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {checkedIds.has(char.id) && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fda4af" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {/* キャラアイコン */}
                <div className="relative h-10 w-10 shrink-0">
                  <div
                    className="h-10 w-10 overflow-hidden rounded-[10px] p-[3px]"
                    style={{
                      border: `1.2px solid ${elemStyle?.border ?? "rgba(249,168,212,0.2)"}`,
                      backgroundColor: elemStyle?.bg ?? "transparent",
                      boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  >
                    {char.imageUrl ? (
                      <Image
                        src={char.imageUrl}
                        alt={char.name}
                        width={40}
                        height={40}
                        className="h-full w-full rounded-[4px] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-[4px] bg-[#2a1f3d] text-[10px] text-[#8b7aab]">
                        {char.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {char.element && elemStyle && (
                    <div
                      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: elemStyle.bg,
                        border: `1.2px solid ${elemStyle.border}`,
                        boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      <span className="text-[7px] font-bold" style={{ color: elemStyle.text }}>
                        {char.element}
                      </span>
                    </div>
                  )}
                </div>

                {/* 名前 + 役割 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#faf5ff]">
                    {char.name}
                  </p>
                  {char.role && (
                    <p className="text-[10px] text-[#8b7aab]">{char.role}</p>
                  )}
                </div>

                {/* ステータス値ボックス */}
                <div
                  className="flex shrink-0 flex-col items-center rounded-[10px] px-2.5 py-1"
                  style={{
                    backgroundColor: "rgba(255,99,126,0.1)",
                    border: "1.2px solid rgba(255,99,126,0.25)",
                  }}
                >
                  <span className="text-[9px] font-bold text-[#8b7aab]">
                    {selectedLabel}
                  </span>
                  <span className="text-xs font-bold text-[#fda4af]">
                    {statValue !== null ? statValue.toLocaleString() : "—"}
                  </span>
                </div>

                {/* 評価 (⭐4.7 コンパクト形式) - 固定幅で位置統一 */}
                <div className="flex w-[52px] shrink-0 flex-col items-end">
                  {char.avgRating !== null && char.validVotesCount >= 4 ? (
                    <>
                      <div className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-[#fcd34d]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-[#faf5ff]">
                          {char.avgRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#8b7aab]">
                        {char.validVotesCount}票
                      </span>
                    </>
                  ) : (
                    <span className="text-[9px] text-[#8b7aab]">
                      {char.validVotesCount > 0 ? `${char.validVotesCount}票` : "未評価"}
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
