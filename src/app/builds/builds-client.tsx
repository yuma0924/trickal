"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CharacterIcon } from "@/components/character/character-icon";
import { ThumbsUpDown } from "@/components/reaction/thumbs-up-down";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ELEMENTS } from "@/lib/constants";
import { useToast, Toast } from "@/components/ui/toast";

// API レスポンスの型
type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  image_url: string | null;
  is_hidden: boolean;
};

type BuildItem = {
  id: string;
  mode: "pvp" | "pve";
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
};

type Mode = "pvp" | "pve";

const MODE_TABS: { value: Mode; label: string; icon: string }[] = [
  { value: "pve", label: "PvE", icon: "shield" },
  { value: "pvp", label: "PvP", icon: "swords" },
];

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

type SortKey = "popular" | "unpopular" | "newest";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "高評価" },
  { value: "unpopular", label: "低評価" },
  { value: "newest", label: "新着" },
];

/**
 * 属性カラー
 */
function getElementBg(element: string): string {
  const map: Record<string, string> = {
    純粋: "rgba(74,222,128,0.15)",
    冷静: "rgba(0,188,255,0.15)",
    狂気: "rgba(255,99,126,0.15)",
    活発: "rgba(255,210,48,0.15)",
    憂鬱: "rgba(166,132,255,0.15)",
  };
  return map[element] ?? "rgba(36,27,53,0.5)";
}

function getElementColor(element: string): string {
  const map: Record<string, string> = {
    純粋: "#4ade80",
    冷静: "#38bdf8",
    狂気: "#fb7185",
    活発: "#fcd34d",
    憂鬱: "#a78bfa",
  };
  return map[element] ?? "#8b7aab";
}

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
  const [mode, setMode] = useState<Mode>("pve");
  const [elementFilter, setElementFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const { toast, showToast } = useToast();

  const fetchBuilds = useCallback(
    async (cursorId?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ mode });
        if (elementFilter) params.set("element", elementFilter);
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
    [mode, elementFilter, sortKey]
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
    <div className="space-y-4">
      {/* PvE / PvP タブ + 投稿ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-[14px] border border-[rgba(249,168,212,0.2)] bg-[rgba(36,27,53,0.8)] p-1">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMode(tab.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                mode === tab.value
                  ? "bg-gradient-to-r from-[rgba(236,72,153,0.3)] to-[rgba(244,63,94,0.3)] border border-[rgba(244,114,182,0.4)] text-[#faf5ff] shadow-[0px_10px_15px_0px_rgba(236,72,153,0.15)]"
                  : "border border-transparent text-[#a893c0] hover:text-[#faf5ff]"
              )}
            >
              {tab.icon === "shield" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            document
              .getElementById("build-form")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-1.5 rounded-[14px] bg-gradient-to-r from-[#fb64b6] to-[#ff637e] px-3 py-2 text-[11px] font-bold text-white shadow-[0px_10px_15px_0px_rgba(246,51,154,0.2),0px_4px_6px_0px_rgba(246,51,154,0.2)] cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          投稿
        </button>
      </div>

      {/* 属性フィルター + ソート */}
      <div className="space-y-2 rounded-2xl border border-[rgba(249,168,212,0.1)] bg-bg-card p-3">
        {/* 属性行 */}
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] text-text-muted">性格</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {ELEMENTS.map((elem) => {
              const active = elementFilter === elem;
              return (
                <button
                  key={elem}
                  onClick={() => setElementFilter(elementFilter === elem ? "" : elem)}
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
        {/* ソート行 */}
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortKey(opt.value)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  sortKey === opt.value
                    ? "bg-accent text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 編成一覧 */}
      {initialLoaded && builds.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {builds.map((build) => (
            <BuildCard
              key={build.id}
              build={build}
              onReaction={handleReaction}
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

      {/* 投稿フォーム */}
      <div id="build-form">
        <BuildPostForm mode={mode} onPosted={() => { fetchBuilds(); showToast("編成を投稿しました！"); }} />
      </div>

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
}: {
  build: BuildItem;
  onReaction: (buildId: string, reaction: "up" | "down" | null) => void;
}) {
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
        "rounded-2xl border border-[rgba(249,168,212,0.1)] bg-gradient-to-b from-[rgba(36,27,53,0.8)] to-[rgba(36,27,53,0.4)] p-3",
        karmaClass
      )}
    >
      <Link
        href={`/builds/${build.id}`}
        className="block cursor-pointer"
      >
        {/* タイトル + 属性タグ */}
        <div className="mb-2 flex items-center gap-1.5">
          {build.title && (
            <span className="truncate text-[11px] font-bold text-[#fce7f3]">
              {build.title}
            </span>
          )}
        </div>
        {/* 属性タグ + モード */}
        <div className="mb-2 flex items-center gap-1">
          {build.members_detail
            .map((m) => m.element)
            .filter((e, i, arr) => e && arr.indexOf(e) === i)
            .map((el) => (
              <span
                key={el}
                className="rounded px-1 py-0.5 text-[8px] font-bold opacity-80"
                style={{
                  backgroundColor: getElementBg(el as string),
                  color: getElementColor(el as string),
                }}
              >
                {el}
              </span>
            ))}
          <span className="rounded bg-[rgba(36,27,53,0.5)] px-1.5 py-0.5 text-[8px] font-bold text-[#8b7aab]">
            {build.mode === "pve" ? "PvE" : "PvP"}
          </span>
        </div>

        {/* キャラ編成 3×2グリッド（後衛/中衛/前衛） */}
        <div className="mb-2 overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.05)]">
          {/* ヘッダー行 */}
          <div className="grid grid-cols-3 bg-[rgba(30,21,48,0.8)]">
            <span className="border-r border-[rgba(249,168,212,0.05)] py-1 text-center text-[9px] font-bold text-[#a893c0]">後衛</span>
            <span className="border-r border-[rgba(249,168,212,0.05)] py-1 text-center text-[9px] font-bold text-[#a893c0]">中衛</span>
            <span className="py-1 text-center text-[9px] font-bold text-[#a893c0]">前衛</span>
          </div>
          {/* 上段 (0,1,2) */}
          <div className="grid grid-cols-3 border-b border-[rgba(249,168,212,0.05)]">
            {build.members_detail.slice(0, 3).map((char, i) => (
              <div key={`${char.id}-${i}`} className={cn(
                "flex flex-col items-center gap-0.5 py-2",
                i < 2 && "border-r border-[rgba(249,168,212,0.05)]"
              )}>
                <CharacterIcon
                  name={char.name}
                  imageUrl={char.image_url}

                  isHidden={char.is_hidden}
                  size="sm"
                />
                <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">
                  {char.name}
                </span>
              </div>
            ))}
          </div>
          {/* 下段 (3,4,5) */}
          {build.members_detail.length > 3 && (
            <div className="grid grid-cols-3">
              {build.members_detail.slice(3, 6).map((char, i) => (
                <div key={`${char.id}-${i + 3}`} className={cn(
                  "flex flex-col items-center gap-0.5 py-2",
                  i < 2 && "border-r border-[rgba(249,168,212,0.05)]"
                )}>
                  <CharacterIcon
                    name={char.name}
                    imageUrl={char.image_url}
  
                    isHidden={char.is_hidden}
                    size="sm"
                  />
                  <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">
                    {char.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* コメント */}
        <p className="whitespace-pre-wrap text-xs text-[rgba(252,231,243,0.8)] leading-relaxed">
          {displayComment}
        </p>
      </Link>

      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-xs text-[#a893c0] hover:text-[#faf5ff] cursor-pointer"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "閉じる" : "続きを読む"}
        </button>
      )}

      {/* フッター: 投稿者 · 日時 + リアクション + コメント数 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-[#8b7aab]">
          {build.display_name && (
            <span>{build.display_name}</span>
          )}
          {build.display_name && <span>·</span>}
          <span>{formatDate(build.updated_at)}</span>
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
      <Button
        className="mt-4"
        onClick={() => {
          document
            .getElementById("build-form")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        編成を投稿
      </Button>
    </div>
  );
}

/**
 * 編成投稿フォーム
 */
function BuildPostForm({
  mode,
  onPosted,
}: {
  mode: Mode;
  onPosted: () => void;
}) {
  const [selectedChars, setSelectedChars] = useState<CharacterInfo[]>([]);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // キャラ検索
  const [searchQuery, setSearchQuery] = useState("");
  const [allCharacters, setAllCharacters] = useState<CharacterInfo[]>([]);
  const [charsLoaded, setCharsLoaded] = useState(false);

  // キャラ一覧をロード（初回のみ）
  useEffect(() => {
    if (charsLoaded) return;

    async function loadCharacters() {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase
          .from("characters")
          .select("id, name, slug, element, image_url, is_hidden")
          .eq("is_hidden", false)
          .order("name");

        if (data) {
          setAllCharacters(
            data.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              element: c.element,
              image_url: c.image_url,
              is_hidden: c.is_hidden,
            }))
          );
        }
        setCharsLoaded(true);
      } catch {
        // ignore
      }
    }

    loadCharacters();
  }, [charsLoaded]);

  // 検索結果のフィルタリング
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCharacters.slice(0, 20);
    }
    const q = searchQuery.toLowerCase();
    return allCharacters
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [searchQuery, allCharacters]);

  const handleAddChar = (char: CharacterInfo) => {
    if (selectedChars.length >= 6) return;
    if (selectedChars.some((c) => c.id === char.id)) return;
    setSelectedChars((prev) => [...prev, char]);
    setSearchQuery("");
  };

  const handleRemoveChar = (charId: string) => {
    setSelectedChars((prev) => prev.filter((c) => c.id !== charId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedChars.length !== 6) {
      setError("メンバーは6人選択してください");
      return;
    }

    if (!comment.trim()) {
      setError("コメントは必須です");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          members: selectedChars.map((c) => c.id),
          comment: comment.trim(),
          title: title.trim() || undefined,
          display_name: displayName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "投稿に失敗しました");
        return;
      }

      setSelectedChars([]);
      setComment("");
      setTitle("");
      setDisplayName("");
      onPosted();
    } catch {
      setError("投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-primary bg-bg-card p-4">
      <h2 className="mb-4 text-lg font-bold text-text-primary">
        編成を投稿
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* タイトル（任意） */}
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            編成名（任意）
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 狂気性格PvP編成"
            maxLength={100}
            className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* メンバー選択 */}
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            メンバー（6人選択）
            <span className="ml-2 text-xs text-text-tertiary">
              {selectedChars.length}/6
            </span>
          </label>

          {/* 選択済みキャラ */}
          {selectedChars.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedChars.map((char) => (
                <div key={char.id} className="relative">
                  <CharacterIcon
                    name={char.name}
                    imageUrl={char.image_url}
  
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveChar(char.id)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-thumbs-down text-[10px] text-white cursor-pointer"
                    aria-label={`${char.name}を削除`}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* キャラ検索 */}
          {selectedChars.length < 6 && (
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="キャラ名で検索..."
                className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
              {searchResults.length > 0 && searchQuery && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-2xl border border-border-primary bg-bg-card">
                  {searchResults.map((char) => (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => handleAddChar(char)}
                      disabled={selectedChars.some((c) => c.id === char.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                        selectedChars.some((c) => c.id === char.id)
                          ? "text-text-muted cursor-not-allowed"
                          : "text-text-primary hover:bg-bg-card-hover"
                      )}
                    >
                      <CharacterIcon
                        name={char.name}
                        imageUrl={char.image_url}
      
                        size="sm"
                      />
                      <span>{char.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 投稿者名（任意） */}
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            名前（任意）
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="名無しの教主"
            maxLength={50}
            className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* コメント */}
        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            コメント
            <span className="ml-2 text-xs text-text-tertiary">
              {comment.length}/200
            </span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="この編成のポイントを教えてください"
            maxLength={200}
            rows={3}
            className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-thumbs-down">{error}</p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "投稿中..." : "投稿する"}
        </Button>
      </form>
    </div>
  );
}
