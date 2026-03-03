"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tab } from "@/components/ui/tab";
import { CharacterIcon } from "@/components/character/character-icon";
import { ThumbsUpDown } from "@/components/reaction/thumbs-up-down";
import { cn } from "@/lib/utils";
import type { Element } from "@/lib/constants";

type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  image_url: string | null;
  is_hidden: boolean;
};

type BuildDetail = {
  id: string;
  mode: "pvp" | "pve";
  party_size: number;
  element_label: string | null;
  title: string | null;
  display_name: string | null;
  comment: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  updated_at: string;
  members_detail: CharacterInfo[];
};

type SimilarBuild = {
  id: string;
  mode: "pvp" | "pve";
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

type SortType = "newest" | "thumbs_up" | "thumbs_down";

const SORT_TABS = [
  { value: "newest" as SortType, label: "新着順" },
  { value: "thumbs_up" as SortType, label: "👍順" },
  { value: "thumbs_down" as SortType, label: "👎順" },
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
  const [userReaction, setUserReaction] = useState<"up" | "down" | null>(null);

  // コメント関連
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [sort, setSort] = useState<SortType>("newest");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // コメント投稿フォーム
  const [commentBody, setCommentBody] = useState("");
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
      {/* 編成情報ヘッダー */}
      <div className={cn("rounded-lg border border-border-primary bg-bg-card p-4", karmaClass)}>
        {/* タイトル + 属性タグ */}
        <div className="mb-3 flex items-center gap-2">
          <h1 className="text-lg font-bold text-text-primary">
            {build.title || `${build.element_label ?? ""}${build.mode.toUpperCase()}編成`}
          </h1>
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
          <Badge variant="outline">
            {build.mode.toUpperCase()}
          </Badge>
        </div>

        {/* キャラアイコン並び */}
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {build.members_detail.map((char, i) => (
            <div key={`${char.id}-${i}`} className="flex flex-col items-center gap-1">
              <CharacterIcon
                name={char.name}
                imageUrl={char.image_url}
                element={char.element as Element | undefined}
                isHidden={char.is_hidden}
                size="md"
              />
              <span className="max-w-14 truncate text-[10px] text-text-tertiary">
                {char.name}
              </span>
            </div>
          ))}
        </div>

        {/* 投稿者 + 日時 */}
        <div className="mb-2 flex items-center gap-2 text-xs text-text-tertiary">
          <span>{build.display_name || "名無しの教主"}</span>
          <span>{formatDate(build.updated_at)}</span>
        </div>

        {/* 説明文 */}
        <p className="mb-3 whitespace-pre-wrap text-sm text-text-secondary">
          {build.comment}
        </p>

        {/* リアクション + 通報 */}
        <div className="flex items-center justify-between">
          <ThumbsUpDown
            thumbsUpCount={build.likes_count}
            thumbsDownCount={build.dislikes_count}
            userReaction={userReaction}
            onReact={handleBuildReaction}
          />
          <button
            onClick={() => setReportTarget({ type: "build", id: build.id })}
            className="text-xs text-text-tertiary hover:text-thumbs-down cursor-pointer"
          >
            通報
          </button>
        </div>
      </div>

      {/* コメント投稿フォーム */}
      <div className="rounded-lg border border-border-primary bg-bg-card p-4">
        <h2 className="mb-3 text-base font-bold text-text-primary">
          コメントを投稿
        </h2>
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div>
            <input
              type="text"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              placeholder="名前（任意）"
              maxLength={50}
              className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="コメントを入力..."
              maxLength={300}
              rows={3}
              className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
            />
            <div className="mt-1 text-right text-xs text-text-tertiary">
              {commentBody.length}/300
            </div>
          </div>
          {commentError && (
            <p className="text-sm text-thumbs-down">{commentError}</p>
          )}
          <Button type="submit" size="sm" disabled={commentSubmitting}>
            {commentSubmitting ? "投稿中..." : "コメントする"}
          </Button>
        </form>
      </div>

      {/* コメント一覧 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text-primary">コメント</h2>
        </div>

        <Tab items={SORT_TABS} value={sort} onChange={setSort} className="mb-3" />

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
                    "rounded-lg border border-border-secondary bg-bg-card p-3",
                    cKarma
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="font-medium text-text-secondary">
                      {c.display_name || "名無しの教主"}
                    </span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                  <p className="mb-2 whitespace-pre-wrap text-sm text-text-primary">
                    {c.body}
                  </p>
                  <div className="flex items-center justify-between">
                    <ThumbsUpDown
                      thumbsUpCount={c.thumbs_up_count}
                      thumbsDownCount={c.thumbs_down_count}
                      userReaction={c.user_reaction}
                      onReact={(reaction) =>
                        handleCommentReaction(c.id, reaction)
                      }
                    />
                    <button
                      onClick={() =>
                        setReportTarget({ type: "build_comment", id: c.id })
                      }
                      className="text-xs text-text-tertiary hover:text-thumbs-down cursor-pointer"
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
      </div>

      {/* 似ている編成 */}
      {similarBuilds.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-bold text-text-primary">
            似ている編成
          </h2>
          <div className="space-y-2">
            {similarBuilds.map((sb) => (
              <Link
                key={sb.id}
                href={`/builds/${sb.id}`}
                className="block rounded-lg border border-border-secondary bg-bg-card p-3 transition-colors hover:bg-bg-card-hover cursor-pointer"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {sb.title || `${sb.element_label ?? ""}${sb.mode.toUpperCase()}編成`}
                  </span>
                  {sb.element_label && (
                    <Badge
                      variant={sb.element_label !== "混合" ? "element" : "default"}
                      element={
                        sb.element_label !== "混合"
                          ? (sb.element_label as Element)
                          : undefined
                      }
                    >
                      {sb.element_label}
                    </Badge>
                  )}
                </div>
                <div className="mb-1 flex gap-1">
                  {sb.members_detail.map((char, i) => (
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
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span>👍 {sb.likes_count}</span>
                  <span>{formatDate(sb.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 通報モーダル */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-bg-card p-4">
            <h3 className="mb-3 text-base font-bold text-text-primary">通報</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="通報理由（任意）"
              maxLength={300}
              rows={3}
              className="mb-3 w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
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
    </div>
  );
}
