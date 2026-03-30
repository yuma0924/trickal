"use client";

import { useState, useMemo } from "react";
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
  members: (string | null)[];
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

const PREVIEW_COUNT = 2;

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
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="relative shrink-0">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as Mode)}
            className="appearance-none rounded-[14px] border border-border-primary bg-bg-card-alpha px-4 py-2.5 pr-9 text-sm font-bold text-text-primary cursor-pointer focus:border-accent focus:outline-none lg:w-48"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* 属性フィルター */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide lg:gap-2">
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
                    : "bg-bg-input"
                )}
                style={{
                  border: `1.2px solid ${active ? "rgba(255,99,126,0.4)" : "var(--border-primary)"}`,
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
        <p className="py-8 text-center text-sm text-text-muted">
          該当する編成がありません
        </p>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {filtered.map((build) => {
            const uniqueElements = [...new Set(build.memberElements)];
            // 9スロット固定配列からスロット位置を再現
            const slots = [...build.members];
            while (slots.length < 9) slots.push(null);
            const rowCount = 3;
            const hasContent = (rowIdx: number) =>
              [0, 1, 2].some((colIdx) => slots[colIdx * rowCount + rowIdx] !== null);

            return (
              <a
                key={build.id}
                href={`/builds/${build.id}`}
                className="block rounded-2xl border border-border-primary bg-gradient-to-b from-bg-card-alpha to-bg-card-alpha-lighter p-4 transition-colors hover:from-bg-card-alpha hover:to-bg-card-alpha-light cursor-pointer"
              >
                {/* タイトル + 属性アイコン + モード */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-bold text-text-primary">
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
                      <span className="rounded-md bg-bg-card-alpha-light px-2 py-0.5 text-[10px] font-bold text-text-muted">
                        {MODE_LABEL_MAP[build.mode] ?? build.mode}
                      </span>
                    )}
                  </div>
                </div>

                {/* キャラ編成グリッド */}
                <div className="mb-2 overflow-hidden rounded-[14px] border border-border-primary">
                  <div className="grid grid-cols-3 bg-bg-inset">
                    <span className="border-r border-border-primary py-1 text-center text-[10px] font-bold text-text-tertiary">後列</span>
                    <span className="border-r border-border-primary py-1 text-center text-[10px] font-bold text-text-tertiary">中列</span>
                    <span className="py-1 text-center text-[10px] font-bold text-text-tertiary">前列</span>
                  </div>
                  {Array.from({ length: rowCount }).map((_, rowIdx) => {
                    const empty = !hasContent(rowIdx);
                    return (
                      <div key={rowIdx} className={cn("grid grid-cols-3", "border-b border-border-primary last:border-b-0", empty && "hidden md:grid")}>
                        {[0, 1, 2].map((colIdx) => {
                          const mId = slots[colIdx * rowCount + rowIdx];
                          const char = mId ? charMap[mId] : null;
                          return (
                            <div key={colIdx} className={cn(
                              "flex flex-col items-center gap-0.5 pt-2 pb-1.5",
                              colIdx < 2 && "border-r border-border-primary"
                            )}>
                              {char ? (
                                <>
                                  <div className="h-12 w-12 overflow-hidden rounded-lg">
                                    {char.imageUrl ? (
                                      <Image src={char.imageUrl} alt={char.name} width={96} height={96} className="h-full w-full object-cover" loading="lazy" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-muted">{char.name.charAt(0)}</div>
                                    )}
                                  </div>
                                  <span className="max-w-20 truncate text-center text-[10px] font-bold text-text-tertiary">{char.name}</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-12 w-12" />
                                  <span className="text-[10px]">&nbsp;</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* コメント */}
                {build.comment && (
                  <div className="mx-0.5 mb-1 flex flex-col rounded-[10px] bg-bg-inset border border-border-secondary px-2.5 py-2 min-h-[76px]">
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-text-primary">
                      {build.comment}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-1">
                      {build.displayName && (
                        <span className="text-[10px] text-text-muted">
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
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
