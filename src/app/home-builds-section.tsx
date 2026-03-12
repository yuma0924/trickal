"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ELEMENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  純粋: { border: "rgba(74,222,128,0.6)", bg: "rgba(74,222,128,0.15)", text: "#34d399" },
  冷静: { border: "rgba(56,189,248,0.6)", bg: "rgba(56,189,248,0.15)", text: "#38bdf8" },
  狂気: { border: "rgba(251,113,133,0.6)", bg: "rgba(251,113,133,0.15)", text: "#fb7185" },
  活発: { border: "rgba(255,210,48,0.6)", bg: "rgba(255,210,48,0.15)", text: "#fcd34d" },
  憂鬱: { border: "rgba(166,132,255,0.6)", bg: "rgba(166,132,255,0.15)", text: "#a78bfa" },
};

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
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
  const [modeFilter, setModeFilter] = useState<"all" | "pve" | "pvp">("all");
  const [elementFilter, setElementFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = builds;
    if (modeFilter !== "all") {
      result = result.filter((b) => b.mode === modeFilter);
    }
    if (elementFilter) {
      result = result.filter((b) => b.memberElements.includes(elementFilter));
    }
    return result.slice(0, PREVIEW_COUNT);
  }, [builds, modeFilter, elementFilter]);

  return (
    <div className="space-y-3">
      {/* フィルター: PvE/PvP + 属性 */}
      <div className="flex items-center gap-0">
        {/* PvE/PvP タブ */}
        <div className="flex shrink-0 items-center rounded-[14px] p-[5px]" style={{ backgroundColor: "rgba(30,21,48,0.8)", border: "1.2px solid rgba(249,168,212,0.1)" }}>
          <button
            onClick={() => setModeFilter(modeFilter === "pve" ? "all" : "pve")}
            className={cn(
              "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-bold transition-colors",
              modeFilter === "pve"
                ? "bg-[rgba(255,99,126,0.15)] text-[#fda4af] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                : "text-[#a893c0]"
            )}
            style={{
              border: modeFilter === "pve" ? "1.2px solid rgba(255,99,126,0.4)" : "1.2px solid transparent",
            }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            PvE
          </button>
          <button
            onClick={() => setModeFilter(modeFilter === "pvp" ? "all" : "pvp")}
            className={cn(
              "flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-bold transition-colors",
              modeFilter === "pvp"
                ? "bg-[rgba(255,99,126,0.15)] text-[#fda4af] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                : "text-[#a893c0]"
            )}
            style={{
              border: modeFilter === "pvp" ? "1.2px solid rgba(255,99,126,0.4)" : "1.2px solid transparent",
            }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5M12 2l2.09 6.26L20 10l-4.87 3.27L16.18 20 12 16.47 7.82 20l1.05-6.73L4 10l5.91-1.74L12 2z" />
            </svg>
            PvP
          </button>
        </div>

        {/* セパレーター */}
        <div className="mx-2 h-5 w-px shrink-0 bg-[rgba(249,168,212,0.1)]" />

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
        <div className="space-y-2">
          {filtered.map((build, buildIndex) => {
            const uniqueElements = [...new Set(build.memberElements)];
            const row1 = build.members.slice(0, 3);
            const row2 = build.members.slice(3, 6);
            const row3 = build.members.slice(6, 9);

            return (
              <Link
                key={build.id}
                href={`/builds/${build.id}`}
                className="block overflow-clip rounded-[16px] bg-gradient-to-b from-[rgba(36,27,53,0.8)] to-[rgba(36,27,53,0.4)] transition-colors hover:from-[rgba(36,27,53,0.9)] hover:to-[rgba(36,27,53,0.6)] cursor-pointer"
                style={{ border: "1.2px solid rgba(249,168,212,0.1)" }}
              >
                <div className="p-3 space-y-2">
                  {/* タイトル行 + 右上コメント数 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[14px] text-xs font-bold shadow-[0px_10px_15px_rgba(0,0,0,0.1)]"
                        style={{
                          backgroundImage: buildIndex === 0
                            ? "linear-gradient(135deg, #ffd230, #fe9a00)"
                            : buildIndex === 1
                            ? "linear-gradient(135deg, #c0c0c0, #90a1b9)"
                            : "linear-gradient(135deg, #b45309, #bb4d00)",
                          color: buildIndex === 0 ? "#461901" : buildIndex === 1 ? "#1a1225" : "#fef3c7",
                        }}
                      >
                        {buildIndex + 1}
                      </span>
                      {build.title && (
                        <span className="truncate text-[11px] font-bold text-[#fce7f3]">
                          {build.title}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-[#8b7aab]">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {build.commentCount}
                    </span>
                  </div>

                  {/* 属性バッジ + モード */}
                  <div className="flex items-center gap-1 pl-[34px]">
                    {uniqueElements.map((elem) => {
                      const es = ELEMENT_COLORS[elem];
                      return es ? (
                        <span
                          key={elem}
                          className="rounded-[4px] px-1 py-0.5 text-[8px] font-bold opacity-80"
                          style={{ backgroundColor: es.bg, color: es.text }}
                        >
                          {elem}
                        </span>
                      ) : null;
                    })}
                    {build.mode && (
                      <span className="rounded-[4px] bg-[rgba(36,27,53,0.5)] px-1.5 py-0.5 text-[8px] font-bold text-[#8b7aab]">
                        {build.mode === "pve" ? "PvE" : build.mode === "pvp" ? "PvP" : "次元"}
                      </span>
                    )}
                  </div>

                  {/* メンバーテーブル */}
                  <div className="overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.05)]">
                    <div className="grid grid-cols-3 bg-[rgba(30,21,48,0.8)]">
                      <span className="border-r border-[rgba(249,168,212,0.05)] py-1 text-center text-[9px] font-bold text-[#a893c0]">後衛</span>
                      <span className="border-r border-[rgba(249,168,212,0.05)] py-1 text-center text-[9px] font-bold text-[#a893c0]">中衛</span>
                      <span className="py-1 text-center text-[9px] font-bold text-[#a893c0]">前衛</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-[rgba(249,168,212,0.05)]">
                      {row1.map((mId, i) => {
                        const char = charMap[mId];
                        const elemStyle = char?.element ? ELEMENT_COLORS[char.element] : null;
                        return (
                          <div key={`${mId}-${i}`} className={`flex flex-col items-center gap-0.5 py-2 ${i < 2 ? "border-r border-[rgba(249,168,212,0.05)]" : ""}`}>
                            <div className="relative">
                              <div className="h-10 w-10 overflow-hidden">
                                {char?.imageUrl ? (
                                  <Image src={char.imageUrl} alt={char?.name ?? "?"} width={40} height={40} className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[#2a1f3d] text-[10px] text-[#8b7aab]">{char?.name?.charAt(0) ?? "?"}</div>
                                )}
                              </div>
                            </div>
                            <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">{char?.name ?? "?"}</span>
                          </div>
                        );
                      })}
                    </div>
                    {row2.length > 0 && (
                      <div className={`grid grid-cols-3 ${row3.length > 0 ? "border-b border-[rgba(249,168,212,0.05)]" : ""}`}>
                        {row2.map((mId, i) => {
                          const char = charMap[mId];
                          return (
                            <div key={`${mId}-${i + 3}`} className={`flex flex-col items-center gap-0.5 py-2 ${i < 2 ? "border-r border-[rgba(249,168,212,0.05)]" : ""}`}>
                              <div className="relative">
                                <div className="h-10 w-10 overflow-hidden">
                                  {char?.imageUrl ? (
                                    <Image src={char.imageUrl} alt={char?.name ?? "?"} width={40} height={40} className="h-full w-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[#2a1f3d] text-[10px] text-[#8b7aab]">{char?.name?.charAt(0) ?? "?"}</div>
                                  )}
                                </div>
                              </div>
                              <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">{char?.name ?? "?"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {row3.length > 0 && (
                      <div className="grid grid-cols-3">
                        {row3.map((mId, i) => {
                          const char = charMap[mId];
                          return (
                            <div key={`${mId}-${i + 6}`} className={`flex flex-col items-center gap-0.5 py-2 ${i < 2 ? "border-r border-[rgba(249,168,212,0.05)]" : ""}`}>
                              <div className="relative">
                                <div className="h-10 w-10 overflow-hidden">
                                  {char?.imageUrl ? (
                                    <Image src={char.imageUrl} alt={char?.name ?? "?"} width={40} height={40} className="h-full w-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-[#2a1f3d] text-[10px] text-[#8b7aab]">{char?.name?.charAt(0) ?? "?"}</div>
                                  )}
                                </div>
                              </div>
                              <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">{char?.name ?? "?"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* コメント */}
                  {build.comment && (
                    <div className="rounded-[14px] border border-[rgba(249,168,212,0.05)] bg-[rgba(30,21,48,0.8)] px-3 py-2.5">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[rgba(252,231,243,0.8)]">
                        {build.comment}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between border-t border-[rgba(249,168,212,0.05)] pt-1.5">
                        {build.displayName && (
                          <span className="text-[10px] text-[#8b7aab]">{build.displayName}</span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f9a8d4]">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                            </svg>
                            {build.likesCount}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7dd3fc]">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                            </svg>
                            {build.dislikesCount}
                          </span>
                        </div>
                      </div>
                    </div>
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
