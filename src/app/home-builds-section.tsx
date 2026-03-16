"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

type Mode = "general" | "arena" | "dimension" | "world_tree";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "general", label: "汎用編成" },
  { value: "arena", label: "PvP" },
  { value: "dimension", label: "次元の衝突" },
  { value: "world_tree", label: "世界樹採掘基地" },
];

const MODE_LABEL_MAP: Record<string, string> = {
  general: "汎用",
  arena: "PvP",
  dimension: "次元",
  world_tree: "世界樹",
};

interface CharInfo {
  name: string;
  element: string | null;
  imageUrl: string | null;
}

interface BuildData {
  id: string;
  mode: string | null;
  members: string[];
  elementLabel: string | null;
  title: string | null;
  displayName: string | null;
  comment: string | null;
  likesCount: number;
  dislikesCount: number;
  commentCount: number;
  memberElements: string[];
}

interface HomeuildsSectionProps {
  builds: BuildData[];
  charMap: Record<string, CharInfo>;
}

const PREVIEW_COUNT = 5;

export function HomeBuildsSection({ builds, charMap }: HomeuildsSectionProps) {
  const [modeFilter, setModeFilter] = useState<Mode>("general");
  const [elementFilter, setElementFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = builds.filter((b) => b.mode === modeFilter);
    if (elementFilter) {
      result = result.filter((b) => b.memberElements.includes(elementFilter));
    }
    return result.slice(0, PREVIEW_COUNT);
  }, [builds, modeFilter, elementFilter]);

  return (
    <div className="space-y-3">
      {/* フィルター: プルダウン + 属性 */}
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as Mode)}
            className="appearance-none rounded-[14px] border border-[rgba(249,168,212,0.2)] bg-[rgba(36,27,53,0.8)] px-4 py-2.5 pr-9 text-sm font-bold text-[#fafafa] cursor-pointer focus:border-[rgba(244,114,182,0.4)] focus:outline-none"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a893c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* 属性フィルター */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {Object.keys(ELEMENT_ICONS).map((elem) => {
            const active = elementFilter === elem;
            return (
              <button
                key={elem}
                onClick={() => setElementFilter(elementFilter === elem ? null : elem)}
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-[10px] p-1.5 transition-colors cursor-pointer",
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
        </div>
      </div>

      {/* 編成リスト */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8b7aab]">
          該当する編成がありません
        </p>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {filtered.map((build) => {
            const uniqueElements = [...new Set(build.memberElements)];
            const row1 = build.members.slice(0, 3);
            const row2 = build.members.slice(3, 6);
            const row3 = build.members.slice(6, 9);

            return (
              <Link
                key={build.id}
                href={`/builds/${build.id}`}
                className="block rounded-2xl border border-[rgba(249,168,212,0.1)] bg-gradient-to-b from-[rgba(36,27,53,0.8)] to-[rgba(36,27,53,0.4)] p-4 transition-colors hover:from-[rgba(36,27,53,0.9)] hover:to-[rgba(36,27,53,0.6)] cursor-pointer"
              >
                {/* タイトル + 属性アイコン + モード */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-bold text-[#fafafa]">
                    {build.title || (build.mode ? (MODE_LABEL_MAP[build.mode] ?? build.mode) : "")}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {uniqueElements.map((elem) => (
                      ELEMENT_ICONS[elem] ? (
                        <Image
                          key={elem}
                          src={ELEMENT_ICONS[elem]}
                          alt={elem}
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px]"
                        />
                      ) : null
                    ))}
                    {build.mode && (
                      <span className="rounded-md bg-[rgba(36,27,53,0.5)] px-2 py-0.5 text-[10px] font-bold text-[#8b7aab]">
                        {MODE_LABEL_MAP[build.mode] ?? build.mode}
                      </span>
                    )}
                  </div>
                </div>

                {/* キャラ編成グリッド */}
                <div className="mb-3 overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.05)]">
                  <div className="grid grid-cols-3 bg-[rgba(42,33,62,0.8)]">
                    <span className="border-r border-[rgba(249,168,212,0.05)] py-1.5 text-center text-[10px] font-bold text-[#a893c0]">後列</span>
                    <span className="border-r border-[rgba(249,168,212,0.05)] py-1.5 text-center text-[10px] font-bold text-[#a893c0]">中列</span>
                    <span className="py-1.5 text-center text-[10px] font-bold text-[#a893c0]">前列</span>
                  </div>
                  {[row1, ...(row2.length > 0 ? [row2] : []), ...(row3.length > 0 ? [row3] : [])].map((row, rowIdx, rows) => (
                    <div key={rowIdx} className={cn("grid grid-cols-3", rowIdx < rows.length - 1 && "border-b border-[rgba(249,168,212,0.05)]")}>
                      {row.map((mId, i) => {
                        const char = charMap[mId];
                        return (
                          <div key={`${mId}-${rowIdx}-${i}`} className={cn(
                            "flex flex-col items-center gap-1 py-3",
                            i < 2 && "border-r border-[rgba(249,168,212,0.05)]"
                          )}>
                            <div className="h-12 w-12 overflow-hidden rounded-lg">
                              {char?.imageUrl ? (
                                <Image src={char.imageUrl} alt={char?.name ?? "?"} width={48} height={48} className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#2a1f3d] text-xs text-[#8b7aab]">{char?.name?.charAt(0) ?? "?"}</div>
                              )}
                            </div>
                            <span className="max-w-20 truncate text-center text-[10px] font-bold text-[#a893c0]">{char?.name ?? "?"}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* コメント */}
                {build.comment && (
                  <div className="mx-0.5 mb-1 rounded-[10px] bg-[rgba(42,33,62,0.8)] border border-[rgba(249,168,212,0.05)] px-2.5 py-2">
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-[#fafafa]">
                      {build.comment}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      {build.displayName && (
                        <span className="text-[10px] text-[#8b7aab]">
                          — {build.displayName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-thumbs-up">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                        </svg>
                        {build.likesCount}
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
