"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CharacterIcon } from "@/components/character/character-icon";
import { ThumbsUpDown } from "@/components/reaction/thumbs-up-down";
import { cn } from "@/lib/utils";
import { ELEMENTS } from "@/lib/constants";
import { useToast, Toast } from "@/components/ui/toast";
import { BuildPostForm } from "./build-post-form";

// API レスポンスの型
type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  position: string | null;
  image_url: string | null;
  is_hidden: boolean;
};

type BuildItem = {
  id: string;
  mode: "general" | "arena" | "dimension" | "world_tree";
  party_size: number;
  members: string[];
  members_detail: CharacterInfo[];
  element_label: string | null;
  title: string | null;
  display_name: string | null;
  comment: string;
  likes_count: number;
  dislikes_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_reaction: "up" | "down" | null;
  comments_count: number;
};

type Mode = "general" | "arena" | "dimension" | "world_tree";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "general", label: "汎用編成" },
  { value: "arena", label: "PvP" },
  { value: "dimension", label: "次元の衝突" },
  { value: "world_tree", label: "世界樹採掘基地" },
];

const MODE_LABEL_MAP: Record<Mode, string> = {
  general: "汎用",
  arena: "PvP",
  dimension: "次元",
  world_tree: "世界樹",
};

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

type SortKey = "popular" | "newest";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "人気" },
  { value: "newest", label: "新着" },
];


/**
 * 自浄作用の CSS クラスを計算
 */
function getKarmaClass(likesCount: number, dislikesCount: number): string {
  const net = likesCount - dislikesCount;
  if (net >= 30) return "karma-gold";
  if (net >= 15) return "karma-bold";
  if (net <= -30) return "karma-very-dim";
  if (net <= -15) return "karma-dim";
  return "";
}

/**
 * 日時を相対表記でフォーマット
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 30) return `${diffDays}日前`;
  return date.toLocaleDateString("ja-JP");
}

export function BuildsClient() {
  const [mode, setMode] = useState<Mode>("general");
  const [elementFilters, setElementFilters] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { toast, showToast } = useToast();

  const fetchBuilds = useCallback(
    async (cursorId?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ mode });
        if (elementFilters.size > 0) params.set("element", [...elementFilters].join(","));
        if (sortKey) params.set("sort", sortKey);
        if (cursorId) params.set("cursor", cursorId);

        const res = await fetch(`/api/builds?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch builds");

        const data = await res.json();
        if (cursorId) {
          setBuilds((prev) => [...prev, ...data.builds]);
        } else {
          setBuilds(data.builds);
        }
        setNextCursor(data.next_cursor);
        setHasMore(data.has_more);
      } catch {
        // エラー時は空のまま
      } finally {
        setLoading(false);
        setInitialLoaded(true);
      }
    },
    [mode, elementFilters, sortKey]
  );

  // mode や filter 変更時にリセット + 再取得
  useEffect(() => {
    setBuilds([]);
    setNextCursor(null);
    setHasMore(false);
    setInitialLoaded(false);
    fetchBuilds();
  }, [fetchBuilds]);

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      fetchBuilds(nextCursor);
    }
  };

  const handleReaction = async (
    buildId: string,
    reaction: "up" | "down" | null
  ) => {
    try {
      const res = await fetch(`/api/builds/${buildId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: reaction }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setBuilds((prev) =>
        prev.map((b) =>
          b.id === buildId
            ? {
                ...b,
                likes_count: data.likes_count,
                dislikes_count: data.dislikes_count,
                user_reaction: data.user_reaction,
              }
            : b
        )
      );
    } catch {
      // リアクションエラーは静かに失敗
    }
  };

  return (
    <div className="space-y-6">
      {/* モバイル: コンテンツ選択 + 投稿ボタン */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="relative">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="w-44 appearance-none rounded-[14px] border border-[rgba(249,168,212,0.2)] bg-[rgba(36,27,53,0.8)] px-4 py-2.5 pr-9 text-sm font-bold text-[#fafafa] cursor-pointer focus:border-[rgba(244,114,182,0.4)] focus:outline-none"
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
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex shrink-0 items-center gap-1.5 rounded-[14px] bg-gradient-to-r from-[#fb64b6] to-[#ff637e] px-5 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_0px_rgba(246,51,154,0.2),0px_4px_6px_0px_rgba(246,51,154,0.2)] cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          投稿
        </button>
      </div>

      {/* 投稿フォーム（フィルターの上に表示） */}
      {formOpen && (
        <div id="build-form" className="mb-6">
          <BuildPostForm
            mode={mode}
            onModeChange={(newMode) => setMode(newMode)}
            onPosted={() => {
              setSortKey("newest");
              setFormOpen(false);
              showToast("編成を投稿しました！");
              setTimeout(() => {
                document.getElementById("build-list-top")?.scrollIntoView({ behavior: "smooth" });
              }, 300);
            }}
            onClose={() => setFormOpen(false)}
          />
        </div>
      )}

      {/* モバイル: 性格フィルター + ソート */}
      <div id="build-list-top" className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setElementFilters(new Set())}
            className={cn(
              "shrink-0 rounded-[10px] px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer",
              elementFilters.size === 0
                ? "bg-[rgba(255,99,126,0.15)] text-[#fafafa] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                : "bg-[#1a1225] text-[#a893c0]"
            )}
            style={{
              border: `1.2px solid ${elementFilters.size === 0 ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
            }}
          >
            全て
          </button>
          {ELEMENTS.map((elem) => {
            const active = elementFilters.has(elem);
            return (
              <button
                key={elem}
                onClick={() => {
                  setElementFilters((prev) => {
                    const next = new Set(prev);
                    if (next.has(elem)) {
                      next.delete(elem);
                    } else {
                      next.add(elem);
                    }
                    return next;
                  });
                }}
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
        {builds.length > 0 && (
          <div className="flex shrink-0 gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortKey(opt.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs md:text-sm font-medium transition-colors cursor-pointer",
                  sortKey === opt.value
                    ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                    : "border-[rgba(139,122,171,0.3)] text-[#8b7aab] hover:text-[#c4b5d4]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PC: モード + フィルター + ソート + 投稿を1行に */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="relative shrink-0">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="appearance-none rounded-[14px] border border-[rgba(249,168,212,0.2)] bg-[rgba(36,27,53,0.8)] px-4 py-2 pr-9 text-sm font-bold text-[#fafafa] cursor-pointer focus:border-[rgba(244,114,182,0.4)] focus:outline-none"
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
        <div className="flex gap-1.5">
          <button
            onClick={() => setElementFilters(new Set())}
            className={cn(
              "shrink-0 rounded-[10px] px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer",
              elementFilters.size === 0
                ? "bg-[rgba(255,99,126,0.15)] text-[#fafafa] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
                : "bg-[#1a1225] text-[#a893c0]"
            )}
            style={{
              border: `1.2px solid ${elementFilters.size === 0 ? "rgba(255,99,126,0.4)" : "rgba(249,168,212,0.1)"}`,
            }}
          >
            全て
          </button>
          {ELEMENTS.map((elem) => {
            const active = elementFilters.has(elem);
            return (
              <button
                key={elem}
                onClick={() => {
                  setElementFilters((prev) => {
                    const next = new Set(prev);
                    if (next.has(elem)) next.delete(elem);
                    else next.add(elem);
                    return next;
                  });
                }}
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
        <div className="ml-auto flex items-center gap-4">
          {builds.length > 0 && (
            <div className="flex gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortKey(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                    sortKey === opt.value
                      ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                      : "border-[rgba(139,122,171,0.3)] text-[#8b7aab] hover:text-[#c4b5d4]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex shrink-0 items-center gap-1.5 rounded-[14px] bg-gradient-to-r from-[#fb64b6] to-[#ff637e] px-5 py-2 text-sm font-bold text-white shadow-[0px_10px_15px_0px_rgba(246,51,154,0.2),0px_4px_6px_0px_rgba(246,51,154,0.2)] cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            投稿
          </button>
        </div>
      </div>

      {/* 編成一覧 */}
      {initialLoaded && builds.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <div className="space-y-6 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
          {builds.map((build, idx) => (
            <BuildCard
              key={build.id}
              build={build}
              onReaction={handleReaction}
              rank={sortKey === "popular" ? idx : -1}
            />
          ))}
        </div>
      )}

      {/* もっと見る */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? "読み込み中..." : "もっと見る"}
          </Button>
        </div>
      )}

      {loading && !initialLoaded && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-text-secondary">読み込み中...</p>
        </div>
      )}

      {/* ナビリンクはサーバーコンポーネント側で表示 */}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

/**
 * 編成カード
 */
function BuildCard({
  build,
  onReaction,
  rank = -1,
}: {
  build: BuildItem;
  onReaction: (buildId: string, reaction: "up" | "down" | null) => void;
  rank?: number;
}) {
  const netScore = build.likes_count - build.dislikes_count;
  const isTop = rank === 0 && netScore >= 2;
  const isSecond = rank === 1 && netScore >= 2;
  const [expanded, setExpanded] = useState(false);
  const karmaClass = getKarmaClass(build.likes_count, build.dislikes_count);

  const commentLines = build.comment.split("\n");
  const shouldTruncate = commentLines.length > 3;
  const displayComment = shouldTruncate && !expanded
    ? commentLines.slice(0, 3).join("\n")
    : build.comment;

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-4",
        isTop
          ? "border-[rgba(252,211,77,0.5)] bg-[rgba(36,27,53,0.8)]"
          : isSecond
            ? "border-[rgba(192,192,210,0.5)] bg-[rgba(36,27,53,0.8)]"
            : "border-[rgba(249,168,212,0.1)] bg-gradient-to-b from-[rgba(36,27,53,0.8)] to-[rgba(36,27,53,0.4)]",
        karmaClass
      )}
    >
      {(isTop || isSecond) && (
        <div className="absolute -top-3 left-3 flex items-center gap-1 rounded-full bg-[#1a1225] px-2 py-0.5 md:gap-1.5 md:px-2.5 md:py-1">
          <svg className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isTop ? "text-[#fcd34d]" : "text-[#c0c0d2]")} viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
          </svg>
          <span className={cn("text-[10px] md:text-xs font-bold", isTop ? "text-[#fcd34d]" : "text-[#c0c0d2]")}>高評価</span>
        </div>
      )}
      <Link
        href={`/builds/${build.id}${isTop ? "?rank=1" : isSecond ? "?rank=2" : ""}`}
        className="block cursor-pointer"
      >
        {/* タイトル + 属性アイコン + モード */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm md:text-base font-bold text-[#fafafa]">
            {build.title || MODE_LABEL_MAP[build.mode]}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {build.members_detail
              .map((m) => m.element)
              .filter((e, i, arr) => e && arr.indexOf(e) === i)
              .map((el) => (
                ELEMENT_ICONS[el as string] ? (
                  <Image
                    key={el}
                    src={ELEMENT_ICONS[el as string]}
                    alt={el as string}
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px]"
                  />
                ) : null
              ))}
            <span className="rounded-md bg-[rgba(36,27,53,0.5)] px-2 py-0.5 text-[10px] md:text-xs font-bold text-[#8b7aab]">
              {MODE_LABEL_MAP[build.mode]}
            </span>
          </div>
        </div>

        {/* キャラ編成グリッド */}
        {(() => {
          // members配列からスロット位置を再現（9枠: 後列×3, 中列×3, 前列×3）
          const charMap = new Map(build.members_detail.map((c) => [c.id, c]));
          const slots: (CharacterInfo | null)[] = build.members.map(
            (id: string | null) => (id ? charMap.get(id) ?? null : null)
          );
          // 9枠に満たない場合はnullで埋める
          while (slots.length < 9) slots.push(null);
          const rowCount = 3;
          // 全スロットが空の行は非表示にする
          const hasContent = (rowIdx: number) =>
            [0, 1, 2].some((colIdx) => slots[colIdx * rowCount + rowIdx] !== null);
          const visibleRows = Array.from({ length: rowCount }).filter((_, i) => hasContent(i));

          return (
            <div className="mb-2 overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.15)]">
              <div className="grid grid-cols-3 bg-[rgba(42,33,62,0.8)]">
                <span className="border-r border-[rgba(249,168,212,0.15)] py-1 text-center text-[10px] md:text-xs font-bold text-[#a893c0]">後列</span>
                <span className="border-r border-[rgba(249,168,212,0.15)] py-1 text-center text-[10px] md:text-xs font-bold text-[#a893c0]">中列</span>
                <span className="py-1 text-center text-[10px] md:text-xs font-bold text-[#a893c0]">前列</span>
              </div>
              {Array.from({ length: rowCount }).map((_, rowIdx) => {
                if (!hasContent(rowIdx)) return (
                  <div key={rowIdx} className="hidden md:grid grid-cols-3 border-b border-[rgba(249,168,212,0.15)] last:border-b-0">
                    {[0, 1, 2].map((colIdx) => (
                      <div key={colIdx} className={cn(
                        "flex flex-col items-center gap-0.5 pt-2 pb-1.5",
                        colIdx < 2 && "border-r border-[rgba(249,168,212,0.15)]"
                      )}>
                        <div className="h-16 w-16" />
                        <span className="text-[10px] md:text-xs">&nbsp;</span>
                      </div>
                    ))}
                  </div>
                );
                return (
                  <div key={rowIdx} className={cn("grid grid-cols-3", "border-b border-[rgba(249,168,212,0.15)] last:border-b-0")}>
                    {[0, 1, 2].map((colIdx) => {
                      const char = slots[colIdx * rowCount + rowIdx];
                      return (
                        <div key={colIdx} className={cn(
                          "flex flex-col items-center gap-0.5 pt-2 pb-1.5",
                          colIdx < 2 && "border-r border-[rgba(249,168,212,0.15)]"
                        )}>
                          {char ? (
                            <>
                              <CharacterIcon
                                name={char.name}
                                imageUrl={char.image_url}
                                isHidden={char.is_hidden}
                                size="md"
                              />
                              <span className="max-w-20 truncate text-center text-[10px] md:text-xs font-bold text-[#a893c0]">
                                {char.name}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="h-16 w-16" />
                              <span className="text-[10px] md:text-xs">&nbsp;</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* コメント */}
        <div className="mx-0.5 flex flex-col rounded-[10px] bg-[rgba(42,33,62,0.8)] border border-[rgba(249,168,212,0.15)] px-2.5 py-2 min-h-[76px]">
          <p className="whitespace-pre-wrap text-[11px] md:text-xs text-[#fafafa] leading-relaxed line-clamp-3">
            {displayComment}
          </p>
          {shouldTruncate && (
            <button
              onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
              className="mt-1 flex items-center gap-1 text-[10px] md:text-xs text-[#a893c0] hover:text-[#fafafa] cursor-pointer"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              {expanded ? "閉じる" : "続きを読む"}
            </button>
          )}
          <div className="mt-auto pt-1">
            {build.display_name && (
              <span className="text-[10px] md:text-xs text-[#8b7aab]">— {build.display_name}</span>
            )}
          </div>
        </div>
      </Link>

      {/* フッター: 日時 + コメント数 + リアクション */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-[#8b7aab]">
          <span>{formatDate(build.updated_at)}</span>
          {build.comments_count > 0 && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {build.comments_count}
              </span>
            </>
          )}
        </div>
        <ThumbsUpDown
          thumbsUpCount={build.likes_count}
          thumbsDownCount={build.dislikes_count}
          userReaction={build.user_reaction}
          onReact={(reaction) => onReaction(build.id, reaction)}
        />
      </div>
    </div>
  );
}

/**
 * 0件時の表示
 */
function EmptyState() {
  return (
    <div className="rounded-2xl border border-border-primary bg-bg-card p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <p className="font-medium text-text-secondary">まだ投稿がありません</p>
      <p className="mt-1 text-sm text-text-tertiary">
        最初の投稿者になろう！
      </p>
    </div>
  );
}

