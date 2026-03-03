"use client";

import { useState, useEffect, useCallback } from "react";
import { CharacterIcon } from "@/components/character/character-icon";
import { CharacterCard } from "@/components/character/character-card";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { cn } from "@/lib/utils";
import type { Element } from "@/lib/constants";
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
  const [userHash, setUserHash] = useState<string | null>(null);

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

      {/* ステータス */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-text-primary">ステータス</h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(character.stats).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg bg-bg-card px-3 py-2"
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
        <section className="space-y-2">
          <h2 className="text-base font-bold text-text-primary">スキル</h2>
          <div className="space-y-2">
            {skills.map((skill, i) => (
              <div key={i} className="rounded-lg bg-bg-card p-3">
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
      <section className="space-y-2">
        <h2 className="text-base font-bold text-text-primary">コメント・投票</h2>
        <CommentForm
          onSubmit={handleSubmit}
          showRating
          loading={submitLoading}
        />
      </section>

      {/* コメント一覧 */}
      <section>
        <h2 className="mb-2 text-base font-bold text-text-primary">
          みんなのコメント ({totalCount})
        </h2>
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
          <h2 className="text-base font-bold text-text-primary">
            同じ属性のキャラクター
          </h2>
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
    </div>
  );
}
