"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CharacterIcon } from "@/components/character/character-icon";
import { CharacterCard } from "@/components/character/character-card";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import type { CharacterDetail, RelatedCharacter } from "./page";

type SortTab = "newest" | "thumbs_up" | "thumbs_down";
type ReactionState = "up" | "down" | null;

interface CommentItem {
  id: string;
  commentType: "vote" | "board";
  displayName: string;
  body: string;
  rating: number | null;
  thumbsUpCount: number;
  thumbsDownCount: number;
  createdAt: string;
  isLatestVote: boolean;
  isDeleted: boolean;
}

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  patk: "物理攻撃",
  matk: "魔法攻撃",
  def: "防御",
  spd: "速度",
  crit: "クリティカル",
};

const SORT_MAP: Record<SortTab, string> = {
  newest: "new",
  thumbs_up: "thumbs_up",
  thumbs_down: "thumbs_down",
};

interface CharacterDetailClientProps {
  character: CharacterDetail;
  relatedCharacters: RelatedCharacter[];
}

export function CharacterDetailClient({
  character,
  relatedCharacters,
}: CharacterDetailClientProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortTab, setSortTab] = useState<SortTab>("newest");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionState>>({});
  const [_userHash, setUserHash] = useState<string | null>(null);

  // user_hash 取得
  useEffect(() => {
    fetch("/api/user-hash")
      .then((r) => r.json())
      .then((data) => setUserHash(data.user_hash))
      .catch(() => {});
  }, []);

  // コメント取得
  const fetchComments = useCallback(
    async (sort: SortTab, offset = 0, append = false) => {
      setCommentsLoading(true);
      try {
        const res = await fetch(
          `/api/comments?character_id=${character.id}&sort=${SORT_MAP[sort]}&limit=20&offset=${offset}`
        );
        const data = await res.json();

        const mapped: CommentItem[] = (data.comments ?? []).map(
          (c: Record<string, unknown>) => ({
            id: c.id as string,
            commentType: c.comment_type as "vote" | "board",
            displayName: (c.display_name as string) ?? "名無しの教主",
            body: (c.body as string) ?? "",
            rating: c.rating as number | null,
            thumbsUpCount: c.thumbs_up_count as number,
            thumbsDownCount: c.thumbs_down_count as number,
            createdAt: c.created_at as string,
            isLatestVote: c.is_latest_vote as boolean,
            isDeleted: c.is_deleted as boolean,
          })
        );

        if (append) {
          setComments((prev) => [...prev, ...mapped]);
        } else {
          setComments(mapped);
        }
        setTotalCount(data.total ?? 0);

        // リアクション取得
        const commentIds = mapped.map((c) => c.id).join(",");
        if (commentIds) {
          const reactRes = await fetch(
            `/api/reactions?comment_ids=${commentIds}`
          );
          const reactData = await reactRes.json();
          if (reactData.reactions) {
            setUserReactions((prev) => ({ ...prev, ...reactData.reactions }));
          }
        }
      } catch {
        // エラー無視
      } finally {
        setCommentsLoading(false);
      }
    },
    [character.id]
  );

  useEffect(() => {
    fetchComments(sortTab);
  }, [sortTab, fetchComments]);

  // コメント投稿
  const handleSubmit = async (data: {
    displayName: string;
    rating: number | null;
    body: string;
  }) => {
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: character.id,
          comment_type: data.rating !== null ? "vote" : "board",
          rating: data.rating,
          body: data.body,
          display_name: data.displayName,
        }),
      });

      if (res.ok) {
        // リロード
        fetchComments(sortTab);
      }
    } catch {
      // エラー無視
    } finally {
      setSubmitLoading(false);
    }
  };

  // リアクション操作
  const handleReact = async (commentId: string, reaction: ReactionState) => {
    // 楽観的更新
    setUserReactions((prev) => ({ ...prev, [commentId]: reaction }));

    try {
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId, reaction_type: reaction }),
      });
      // カウントを正確に反映するためリロード
      fetchComments(sortTab);
    } catch {
      // ロールバック
      setUserReactions((prev) => ({ ...prev, [commentId]: null }));
    }
  };

  // 通報
  const handleReport = async (commentId: string) => {
    if (!confirm("このコメントを通報しますか？")) return;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "comment",
          target_id: commentId,
        }),
      });

      if (res.ok) {
        alert("通報しました");
      } else {
        const data = await res.json();
        alert(data.error ?? "通報に失敗しました");
      }
    } catch {
      alert("通報に失敗しました");
    }
  };

  // ソートタブ変更
  const handleSortChange = (tab: SortTab) => {
    setSortTab(tab);
  };

  // もっと読む
  const handleLoadMore = () => {
    fetchComments(sortTab, comments.length, true);
  };

  // メタデータ（アルバイトアイテムなど）
  const meta = character.metadata as Record<string, unknown> | null;
  const partTimeItem = meta?.part_time_item as string | undefined;

  // スキル情報
  const skills = character.skills as Array<Record<string, unknown>> | null;

  return (
    <div className="space-y-6">
      {/* ヒーローエリア */}
      <div className="rounded-2xl bg-bg-card border border-border-primary p-4">
        <div className="flex items-start gap-4">
          <CharacterIcon
            name={character.name}
            imageUrl={character.imageUrl}
            element={character.element ?? undefined}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">
                {character.name}
              </h1>
              {character.isProvisional && (
                <span className="text-sm" title="暫定値">⚠️</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {character.element && (
                <Badge variant="element" element={character.element}>
                  {character.element}
                </Badge>
              )}
              {character.rarity && (
                <Badge>{character.rarity}</Badge>
              )}
              {character.role && (
                <Badge variant="outline">{character.role}</Badge>
              )}
            </div>
            {character.avgRating !== null && character.validVotesCount >= 4 ? (
              <div className="mt-2">
                <StarRatingDisplay rating={character.avgRating} size="md" showValue />
                <span className="ml-2 text-xs text-text-tertiary">
                  ({character.validVotesCount}票)
                </span>
                {character.rank !== null && (
                  <Badge variant="rank" className="ml-2">
                    #{character.rank}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-text-tertiary">
                {character.validVotesCount > 0
                  ? `${character.validVotesCount}票（順位対象外）`
                  : "まだ投票がありません"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ステータス */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
          <h2 className="text-xl font-bold text-text-primary">ステータス</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(character.stats).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-2xl bg-bg-card border border-border-primary px-3 py-2"
            >
              <span className="text-xs text-text-secondary">
                {STAT_LABELS[key] ?? key}
              </span>
              <span className="text-sm font-bold text-text-primary">
                {value !== null ? value.toLocaleString() : "未入力"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* スキル */}
      {skills && skills.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
            <h2 className="text-xl font-bold text-text-primary">スキル</h2>
          </div>
          <div className="space-y-2">
            {skills.map((skill, i) => (
              <div key={i} className="rounded-2xl bg-bg-card border border-border-primary p-4">
                <h3 className="text-sm font-medium text-text-primary">
                  {(skill.name as string) ?? `スキル${i + 1}`}
                </h3>
                {typeof skill.description === "string" && (
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                    {skill.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* アルバイトアイテム */}
      {partTimeItem && (
        <p className="text-xs text-text-tertiary">
          アルバイトアイテム: {partTimeItem}
        </p>
      )}

      {/* 投稿フォーム */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {character.name}を評価する
            </h2>
            <p className="text-sm text-text-tertiary">評価とコメントを投稿できます</p>
          </div>
        </div>
        <CommentForm
          onSubmit={handleSubmit}
          showRating
          loading={submitLoading}
        />
      </section>

      {/* コメント一覧 */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              みんなのコメント ({totalCount})
            </h2>
            <p className="text-sm text-text-tertiary">新着順・高評価順で表示</p>
          </div>
        </div>
        <CommentList
          comments={comments}
          totalCount={totalCount}
          sortTab={sortTab}
          onSortChange={handleSortChange}
          onLoadMore={handleLoadMore}
          loading={commentsLoading}
          userReactions={userReactions}
          onReact={handleReact}
          onReport={handleReport}
        />
      </section>

      {/* 回遊エリア: 関連キャラ */}
      {relatedCharacters.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                次に見る
              </h2>
              <p className="text-sm text-text-tertiary">同じ属性・レアリティのキャラ</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {relatedCharacters.map((c) => (
              <CharacterCard
                key={c.id}
                slug={c.slug}
                name={c.name}
                imageUrl={c.imageUrl}
                element={c.element ?? undefined}
                avgRating={c.avgRating}
                validVotesCount={c.validVotesCount}
              />
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
    </div>
  );
}
