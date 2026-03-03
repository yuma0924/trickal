"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { Tab } from "@/components/ui/tab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CharacterIcon } from "@/components/character/character-icon";
import { ThumbsUpDown } from "@/components/reaction/thumbs-up-down";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Element } from "@/lib/constants";
import { ELEMENTS } from "@/lib/constants";

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

const MODE_TABS = [
  { value: "pvp" as Mode, label: "PvP" },
  { value: "pve" as Mode, label: "PvE" },
];

const ELEMENT_FILTERS = [
  { value: "", label: "すべて" },
  ...ELEMENTS.map((e) => ({ value: e, label: e })),
  { value: "混合", label: "混合" },
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
  const [mode, setMode] = useState<Mode>("pvp");
  const [elementFilter, setElementFilter] = useState("");
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchBuilds = useCallback(
    async (cursorId?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ mode });
        if (elementFilter) params.set("element", elementFilter);
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
    [mode, elementFilter]
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
      {/* PvP / PvE タブ */}
      <Tab items={MODE_TABS} value={mode} onChange={setMode} />

      {/* 属性フィルター + 投稿ボタン */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {ELEMENT_FILTERS.map((ef) => (
            <button
              key={ef.value}
              onClick={() => setElementFilter(ef.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                elementFilter === ef.value
                  ? "bg-accent text-accent-text"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              {ef.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            document
              .getElementById("build-form")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          + 編成を投稿
        </Button>
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
        <BuildPostForm mode={mode} onPosted={() => fetchBuilds()} />
      </div>
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
        "rounded-lg border border-border-primary bg-bg-card p-3",
        karmaClass
      )}
    >
      <Link
        href={`/builds/${build.id}`}
        className="block cursor-pointer"
      >
        {/* タイトル + 属性タグ */}
        <div className="mb-2 flex items-center gap-2">
          {build.title && (
            <span className="text-sm font-medium text-text-primary">
              {build.title}
            </span>
          )}
          {build.element_label && (
            <Badge
              variant={build.element_label !== "混合" ? "element" : "default"}
              element={
                build.element_label !== "混合"
                  ? (build.element_label as Element)
                  : undefined
              }
            >
              {build.element_label}
            </Badge>
          )}
        </div>

        {/* キャラアイコン並び */}
        <div className="mb-2 flex gap-1.5 overflow-x-auto">
          {build.members_detail.map((char, i) => (
            <CharacterIcon
              key={`${char.id}-${i}`}
              name={char.name}
              imageUrl={char.image_url}
              element={char.element as Element | undefined}
              isHidden={char.is_hidden}
              size="sm"
            />
          ))}
        </div>

        {/* コメント */}
        <p className="whitespace-pre-wrap text-sm text-text-secondary">
          {displayComment}
        </p>
      </Link>

      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs text-accent hover:underline cursor-pointer"
        >
          {expanded ? "閉じる" : "もっと読む"}
        </button>
      )}

      {/* フッター: リアクション + 日時 + 投稿者 */}
      <div className="mt-2 flex items-center justify-between">
        <ThumbsUpDown
          thumbsUpCount={build.likes_count}
          thumbsDownCount={build.dislikes_count}
          userReaction={build.user_reaction}
          onReact={(reaction) => onReaction(build.id, reaction)}
        />
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {build.display_name && (
            <span>{build.display_name}</span>
          )}
          <span>{formatDate(build.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 0件時の表示
 */
function EmptyState() {
  return (
    <div className="rounded-lg border border-border-primary bg-bg-card p-8 text-center">
      <p className="text-text-secondary">まだ投稿がありません</p>
      <p className="mt-2 text-sm text-text-tertiary">
        最初の投稿者になろう!
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          document
            .getElementById("build-form")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        + 編成を投稿
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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

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

      setSuccess(true);
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
    <div className="rounded-lg border border-border-primary bg-bg-card p-4">
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
            placeholder="例: 火属性PvP編成"
            maxLength={100}
            className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
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
                    element={char.element as Element | undefined}
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
                className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
              {searchResults.length > 0 && searchQuery && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border-primary bg-bg-card">
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
                        element={char.element as Element | undefined}
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
            className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
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
            className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-thumbs-down">{error}</p>
        )}

        {success && (
          <p className="text-sm text-thumbs-up">投稿しました!</p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "投稿中..." : "投稿する"}
        </Button>
      </form>
    </div>
  );
}
