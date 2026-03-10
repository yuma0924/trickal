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
      <div className={cn("rounded-2xl border border-border-primary bg-bg-card p-4", karmaClass)}>
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
            <Link key={`${char.id}-${i}`} href={char.slug ? `/characters/${char.slug}` : "#"} className="flex flex-col items-center gap-1">
              <CharacterIcon
                name={char.name}
                imageUrl={char.image_url}
                isHidden={char.is_hidden}
                size="md"
              />
              <span className="max-w-14 truncate text-[10px] text-text-tertiary">
                {char.name}
              </span>
            </Link>
          ))}
        </div>

        {/* 投稿者 + 日時 */}
        <div className="mb-2 flex items-center gap-2 text-xs text-text-tertiary">
          <span>{build.display_name || "名無しの教主"}</span>
          <span>{formatDate(build.updated_at)}</span>
        </div>

        {/* 説明文 */}
        <p className="mb-3 whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
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
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
          <div>
            <h2 className="text-xl font-bold text-text-primary">この編成にコメントする</h2>
            <p className="text-sm text-text-tertiary">思ったこと感想や改善点を共有しよう</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border-primary bg-bg-card p-4">
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div>
              <input
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="名前（任意）"
                maxLength={50}
                className="w-full rounded-xl border border-border-primary bg-bg-input px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
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
      </section>

      {/* コメント一覧 */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
          <h2 className="text-xl font-bold text-text-primary">コメント</h2>
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
                    "rounded-2xl border border-border-primary bg-bg-card/30 p-4",
                    cKarma
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-text-tertiary">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] text-white" style={{backgroundImage: "linear-gradient(135deg, #fb64b6, #ffa1ad)"}}>
                      {(c.display_name || "名")[0]}
                    </div>
                    <span className="font-medium text-text-secondary">
                      {c.display_name || "名無しの教主"}
                    </span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                  <p className="mb-2 whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
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
                      className="text-xs text-text-muted hover:text-thumbs-down cursor-pointer"
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
          <div className="space-y-2">
            {similarBuilds.map((sb) => (
              <Link
                key={sb.id}
                href={`/builds/${sb.id}`}
                className="block rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover cursor-pointer"
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
        </section>
      )}

      {/* ページ下部ナビリンク */}
      <div className="mt-8 space-y-3">
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
            <span className="block font-bold text-text-primary">編成ランキング</span>
            <span className="text-xs text-text-tertiary">人気のパーティ編成をチェックしよう</span>
          </div>
        </Link>
        <Link href="/stats" className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{backgroundImage: "linear-gradient(135deg, #8b5cf6, #a78bfa)"}}>
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">ステータス別ランキング</span>
            <span className="text-xs text-text-tertiary">ステータスで比較して最強キャラを見つけよう</span>
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
    </div>
  );
}
