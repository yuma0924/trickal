"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { CharacterIcon } from "@/components/character/character-icon";
import { ThumbsUpDown } from "@/components/reaction/thumbs-up-down";
import { cn } from "@/lib/utils";
import { useToast, Toast } from "@/components/ui/toast";

const ELEMENT_ICONS: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  position: string | null;
  image_url: string | null;
  is_hidden: boolean;
};

type Mode = "general" | "arena" | "dimension" | "world_tree";

const MODE_LABEL_MAP: Record<Mode, string> = {
  general: "汎用編成",
  arena: "PvP",
  dimension: "次元の衝突",
  world_tree: "世界樹採掘基地",
};

type BuildDetail = {
  id: string;
  mode: Mode;
  party_size: number;
  element_label: string | null;
  title: string | null;
  display_name: string | null;
  comment: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  updated_at: string;
  members: (string | null)[];
  members_detail: CharacterInfo[];
};

type SimilarBuild = {
  id: string;
  mode: Mode;
  title: string | null;
  display_name: string | null;
  comment: string;
  element_label: string | null;
  likes_count: number;
  members_detail: CharacterInfo[];
  updated_at: string;
};

type CommentItem = {
  id: string;
  build_id: string;
  display_name: string | null;
  body: string;
  thumbs_up_count: number;
  thumbs_down_count: number;
  created_at: string;
  user_reaction: "up" | "down" | null;
};

type SortType = "newest" | "thumbs_up";

const SORT_TABS = [
  { value: "newest" as SortType, label: "新着順" },
  { value: "thumbs_up" as SortType, label: "👍順" },
];

function getKarmaClass(likesCount: number, dislikesCount: number): string {
  const net = likesCount - dislikesCount;
  if (net >= 30) return "karma-gold";
  if (net >= 15) return "karma-bold";
  if (net <= -30) return "karma-very-dim";
  if (net <= -15) return "karma-dim";
  return "";
}

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

interface BuildDetailClientProps {
  build: BuildDetail;
  similarBuilds: SimilarBuild[];
}

export function BuildDetailClient({
  build: initialBuild,
  similarBuilds,
}: BuildDetailClientProps) {
  const [build, setBuild] = useState(initialBuild);
  const searchParams = useSearchParams();
  const rankParam = searchParams.get("rank");
  const isTopRank = rankParam === "1";
  const isSecondRank = rankParam === "2";
  const [userReaction, setUserReaction] = useState<"up" | "down" | null>(null);

  // コメントフォーム開閉
  const [commentFormOpen, setCommentFormOpen] = useState(false);

  // コメント関連
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [sort, setSort] = useState<SortType>("newest");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // コメント投稿フォーム
  const [commentBody, setCommentBody] = useState("");
  const { toast, showToast } = useToast();
  const [commentName, setCommentName] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // 通報
  const [reportTarget, setReportTarget] = useState<{
    type: "build" | "build_comment";
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchComments = useCallback(
    async (cursorId?: string) => {
      setCommentsLoading(true);
      try {
        const params = new URLSearchParams({ sort });
        if (cursorId) params.set("cursor", cursorId);

        const res = await fetch(
          `/api/builds/${build.id}/comments?${params.toString()}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (cursorId) {
          setComments((prev) => [...prev, ...data.comments]);
        } else {
          setComments(data.comments);
        }
        setNextCursor(data.next_cursor);
        setHasMoreComments(data.has_more);
      } catch {
        // ignore
      } finally {
        setCommentsLoading(false);
        setCommentsLoaded(true);
      }
    },
    [build.id, sort]
  );

  // ソート変更時にリロード
  useEffect(() => {
    setComments([]);
    setNextCursor(null);
    setHasMoreComments(false);
    setCommentsLoaded(false);
    fetchComments();
  }, [fetchComments]);

  // 初期リアクション状態を取得
  useEffect(() => {
    async function fetchReaction() {
      try {
        const res = await fetch(`/api/builds/${build.id}`);
        if (res.ok) {
          const data = await res.json();
          setUserReaction(data.build.user_reaction);
        }
      } catch {
        // ignore
      }
    }
    fetchReaction();
  }, [build.id]);

  const handleBuildReaction = async (reaction: "up" | "down" | null) => {
    try {
      const res = await fetch(`/api/builds/${build.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: reaction }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setBuild((prev) => ({
        ...prev,
        likes_count: data.likes_count,
        dislikes_count: data.dislikes_count,
      }));
      setUserReaction(data.user_reaction);
    } catch {
      // ignore
    }
  };

  const handleCommentReaction = async (
    commentId: string,
    reaction: "up" | "down" | null
  ) => {
    try {
      const res = await fetch(
        `/api/builds/${build.id}/comments/${commentId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction_type: reaction }),
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                thumbs_up_count: data.thumbs_up_count,
                thumbs_down_count: data.thumbs_down_count,
                user_reaction: data.user_reaction,
              }
            : c
        )
      );
    } catch {
      // ignore
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);

    if (!commentBody.trim()) {
      setCommentError("コメントは必須です");
      return;
    }

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/builds/${build.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentBody.trim(),
          display_name: commentName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error || "投稿に失敗しました");
        return;
      }

      // 新着順の場合は先頭に追加
      if (sort === "newest") {
        setComments((prev) => [data.comment, ...prev]);
      } else {
        // ソート済みの場合は再取得
        fetchComments();
      }
      setCommentBody("");
      setCommentName("");
      showToast("コメントを投稿しました！");
    } catch {
      setCommentError("投稿に失敗しました");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportTarget) return;
    setReportSubmitting(true);
    setReportSuccess(false);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: reportTarget.type,
          target_id: reportTarget.id,
          reason: reportReason.trim() || undefined,
        }),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportTarget(null);
          setReportReason("");
          setReportSuccess(false);
        }, 2000);
      }
    } catch {
      // ignore
    } finally {
      setReportSubmitting(false);
    }
  };

  const karmaClass = getKarmaClass(build.likes_count, build.dislikes_count);

  return (
    <div className="space-y-6">
      {/* 編成情報カード */}
      <div className={cn(
        "relative rounded-2xl border p-4 md:max-w-xl",
        isTopRank
          ? "border-[rgba(252,211,77,0.5)] bg-[rgba(36,27,53,0.8)]"
          : isSecondRank
            ? "border-[rgba(192,192,210,0.5)] bg-[rgba(36,27,53,0.8)]"
            : "border-[rgba(249,168,212,0.1)] bg-gradient-to-b from-[rgba(36,27,53,0.8)] to-[rgba(36,27,53,0.4)]",
        karmaClass
      )}>
        {(isTopRank || isSecondRank) && (
          <div className="absolute -top-3 left-3 flex items-center gap-1 rounded-full bg-[#1a1225] px-2 py-0.5 md:gap-1.5 md:px-2.5 md:py-1">
            <svg className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isTopRank ? "text-[#fcd34d]" : "text-[#c0c0d2]")} viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
            </svg>
            <span className={cn("text-[10px] md:text-xs font-bold", isTopRank ? "text-[#fcd34d]" : "text-[#c0c0d2]")}>高評価</span>
          </div>
        )}
        {/* タイトル + 属性アイコン + モード + 通報 */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="min-w-0 truncate text-sm font-bold text-[#fafafa]">
            {build.title || MODE_LABEL_MAP[build.mode]}
          </h1>
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
            <span className="rounded-md bg-[rgba(36,27,53,0.5)] px-2 py-0.5 text-[10px] font-bold text-[#8b7aab]">
              {MODE_LABEL_MAP[build.mode]}
            </span>
            <button
              onClick={() => setReportTarget({ type: "build", id: build.id })}
              className="text-[10px] text-[#8b7aab]/50 hover:text-thumbs-down cursor-pointer"
            >
              通報
            </button>
          </div>
        </div>

        {/* キャラ編成グリッド */}
        {(() => {
          const charMap = new Map(build.members_detail.map((c) => [c.id, c]));
          const slots: (CharacterInfo | null)[] = build.members.map(
            (id) => (id ? charMap.get(id) ?? null : null)
          );
          while (slots.length < 9) slots.push(null);
          const rowCount = 3;
          const hasContent = (rowIdx: number) =>
            [0, 1, 2].some((colIdx) => slots[colIdx * rowCount + rowIdx] !== null);

          return (
            <div className="mb-2 overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.15)]">
              <div className="grid grid-cols-3 bg-[rgba(42,33,62,0.8)]">
                <span className="border-r border-[rgba(249,168,212,0.15)] py-1 text-center text-[10px] font-bold text-[#a893c0]">後列</span>
                <span className="border-r border-[rgba(249,168,212,0.15)] py-1 text-center text-[10px] font-bold text-[#a893c0]">中列</span>
                <span className="py-1 text-center text-[10px] font-bold text-[#a893c0]">前列</span>
              </div>
              {Array.from({ length: rowCount }).map((_, rowIdx) => {
                if (!hasContent(rowIdx)) return null;
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
                            <Link href={char.slug ? `/characters/${char.slug}` : "#"} className="flex flex-col items-center gap-0.5">
                              <CharacterIcon
                                name={char.name}
                                imageUrl={char.image_url}
                                isHidden={char.is_hidden}
                                size="md"
                              />
                              <span className="max-w-20 truncate text-center text-[10px] font-bold text-[#a893c0]">
                                {char.name}
                              </span>
                            </Link>
                          ) : (
                            <div className="h-16 w-16" />
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
          <p className="whitespace-pre-wrap text-[11px] md:text-xs text-[#fafafa] leading-relaxed">
            {build.comment}
          </p>
          <div className="mt-auto pt-1">
            {build.display_name && (
              <span className="text-[10px] md:text-xs text-[#8b7aab]">— {build.display_name}</span>
            )}
          </div>
        </div>

        {/* フッター: 日時 + リアクション */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-[#8b7aab]">
            <span>{formatDate(build.updated_at)}</span>
          </div>
          <ThumbsUpDown
            thumbsUpCount={build.likes_count}
            thumbsDownCount={build.dislikes_count}
            userReaction={userReaction}
            onReact={handleBuildReaction}
          />
        </div>
      </div>

      {/* コメント投稿 */}
      <section>
        {!commentFormOpen ? (
          <div className="rounded-[14px] bg-gradient-to-r from-[rgba(246,51,154,0.1)] to-[rgba(255,32,86,0.1)] border border-[rgba(251,100,182,0.3)] p-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#fafafa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-bold text-[#fafafa]">
                    この編成にコメントする
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#8b7aab]">感想や改善点を共有しよう</p>
              </div>
              <button
                onClick={() => setCommentFormOpen(true)}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#fb64b6] to-[#ff637e] px-5 py-3 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                投稿する
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border-primary bg-bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-[#fafafa]">コメントを投稿</span>
              <button
                onClick={() => setCommentFormOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-bg-tertiary hover:text-text-primary cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <input
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="名前（任意）"
                maxLength={50}
                className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
              <div>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="コメントを入力..."
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
                />
                <div className="mt-1 text-right text-xs text-text-tertiary">
                  {commentBody.length}/300
                </div>
              </div>
              {commentError && (
                <p className="text-sm text-thumbs-down">{commentError}</p>
              )}
              <Button type="submit" disabled={commentSubmitting} className="w-full">
                {commentSubmitting ? "投稿中..." : "コメントする"}
              </Button>
            </form>
          </div>
        )}
      </section>

      {/* コメント一覧 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 md:h-5 md:w-5 text-[#c0bbc8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm md:text-base font-bold text-[#fafafa]">
              コメント ({comments.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {SORT_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSort(tab.value)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs md:text-sm md:px-3 md:py-1.5 font-medium transition-colors cursor-pointer",
                  sort === tab.value
                    ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                    : "border-[rgba(139,122,171,0.3)] text-[#8b7aab] hover:text-[#c4b5d4]"
                )}
              >
                {tab.value === "thumbs_up" && (
                  <svg className="h-3 w-3 text-[#fb64b6]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
                  </svg>
                )}
                {tab.value === "thumbs_up" ? "順" : tab.label}
              </button>
            ))}
          </div>
        </div>

        {commentsLoaded && comments.length === 0 && !commentsLoading ? (
          <p className="py-4 text-center text-sm text-text-tertiary">
            まだコメントはありません
          </p>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => {
              const cKarma = getKarmaClass(c.thumbs_up_count, c.thumbs_down_count);
              return (
                <div
                  key={c.id}
                  className={cn(
                    "rounded-2xl bg-bg-card border border-border-primary px-4 pt-4 pb-3",
                    cKarma
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: "#34d399" }}
                    />
                    <div className="flex flex-col -mt-1">
                      <span className="text-base font-medium text-text-primary">
                        {c.display_name || "名無しの教主"}
                      </span>
                      <span className="text-xs md:text-sm text-text-muted">{formatDate(c.created_at)}</span>
                    </div>
                  </div>
                  <p className="mt-2.5 whitespace-pre-wrap text-base text-text-secondary leading-relaxed">
                    {c.body}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-text-muted text-xs md:text-sm">
                    <ThumbsUpDown
                      thumbsUpCount={c.thumbs_up_count}
                      thumbsDownCount={c.thumbs_down_count}
                      userReaction={c.user_reaction}
                      onReact={(reaction) =>
                        handleCommentReaction(c.id, reaction)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setReportTarget({ type: "build_comment", id: c.id })}
                      className="ml-auto rounded-full border border-border-primary px-2.5 py-1 text-[10px] md:text-xs text-text-muted transition-colors hover:border-thumbs-down/20 hover:text-thumbs-down cursor-pointer"
                    >
                      通報
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMoreComments && (
          <div className="flex justify-center py-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (nextCursor) fetchComments(nextCursor);
              }}
              disabled={commentsLoading}
            >
              {commentsLoading ? "読み込み中..." : "もっと見る"}
            </Button>
          </div>
        )}
      </section>

      {/* 似ている編成 */}
      {similarBuilds.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
            <h2 className="text-xl font-bold text-text-primary">似ている編成</h2>
          </div>
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {similarBuilds.map((sb) => (
              <Link
                key={sb.id}
                href={`/builds/${sb.id}`}
                className="block rounded-2xl border border-border-primary bg-bg-card px-4 pt-2.5 pb-3 transition-colors hover:bg-bg-card-hover cursor-pointer"
              >
                {/* タイトル + 性格アイコン + モード */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-bold text-[#fafafa]">
                    {sb.title || MODE_LABEL_MAP[sb.mode]}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {sb.members_detail
                      .map((m) => m.element)
                      .filter((e, i, arr) => e && arr.indexOf(e) === i)
                      .map((el) => (
                        ELEMENT_ICONS[el as string] ? (
                          <Image
                            key={el}
                            src={ELEMENT_ICONS[el as string]}
                            alt={el as string}
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
                        ) : null
                      ))}
                    <span className="rounded-md bg-[rgba(36,27,53,0.5)] px-2 py-0.5 text-[10px] font-bold text-[#8b7aab]">
                      {MODE_LABEL_MAP[sb.mode]}
                    </span>
                  </div>
                </div>
                {/* キャラアイコン */}
                <div className="mb-2 flex gap-1">
                  {sb.members_detail.map((char, i) => (
                    <CharacterIcon
                      key={`${char.id}-${i}`}
                      name={char.name}
                      imageUrl={char.image_url}
                      isHidden={char.is_hidden}
                      size="sm"
                    />
                  ))}
                </div>
                {/* 日時 + いいね数 */}
                <div className="mt-1 flex items-center justify-between text-xs text-[#8b7aab]">
                  <span>{formatDate(sb.updated_at)}</span>
                  <span className="flex items-center gap-0.5 text-thumbs-up">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
                    </svg>
                    {sb.likes_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ページ下部ナビリンク */}
      <div className="mt-10 space-y-3">
        <p className="pl-1 text-sm font-bold text-text-primary">他のランキングもチェック</p>
        <Link href="/ranking" className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{backgroundImage: "linear-gradient(135deg, #fb64b6, #ffa1ad)"}}>
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">人気キャラランキング</span>
            <span className="text-xs text-text-tertiary">投票で決まる最強キャラをチェック</span>
          </div>
        </Link>
        <Link href="/builds" className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{backgroundImage: "linear-gradient(135deg, #3b82f6, #60a5fa)"}}>
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">人気編成ランキング</span>
            <span className="text-xs text-text-tertiary">人気のパーティ編成をチェックしよう</span>
          </div>
        </Link>
      </div>

      {/* 通報モーダル */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-bg-card p-4">
            <h3 className="mb-3 text-base font-bold text-text-primary">通報</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="通報理由（任意）"
              maxLength={300}
              rows={3}
              className="mb-3 w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
            />
            {reportSuccess ? (
              <p className="text-sm text-thumbs-up">通報しました</p>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReport}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? "送信中..." : "通報する"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReportTarget(null);
                    setReportReason("");
                  }}
                >
                  キャンセル
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
