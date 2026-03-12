"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CharacterCard } from "@/components/character/character-card";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { cn } from "@/lib/utils";
import type { CharacterDetail, RelatedCharacter } from "./page";


/** パラメータ行の「ラベル: 値」を分割し、値部分にアクセント色を適用 */
function ParamLine({ text }: { text: string }) {
  const match = text.match(/^(.+?)([：:]\s*)(.+)$/);
  if (!match) return <>{text}</>;
  const [, label, sep, value] = match;
  return (
    <>
      <span>{label}{sep}</span>
      <span className="font-medium text-[#fcd34d]">{value}</span>
    </>
  );
}

/** **text** を強調色の <span> に変換して表示 */
function StyledText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="font-semibold text-[#e8b4d0]">{part.slice(2, -2)}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

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

const SKILL_CATEGORIES: { key: string; label: string; hasName?: boolean; hasCooltime?: boolean }[] = [
  { key: "low_grade", label: "低学年スキル", hasName: true },
  { key: "high_grade", label: "高学年スキル", hasName: true, hasCooltime: true },
  { key: "passive", label: "パッシブスキル" },
];

const NORMAL_ATTACK_CATEGORIES = [
  { key: "normal_attack_basic", label: "基本" },
  { key: "normal_attack_enhanced", label: "強化" },
];

// Element color mappings for header image border/bg
const ELEMENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  純粋: { border: "rgba(74,222,128,0.6)", bg: "rgba(74,222,128,0.15)", text: "#4ade80" },
  冷静: { border: "rgba(56,189,248,0.6)", bg: "rgba(56,189,248,0.15)", text: "#38bdf8" },
  狂気: { border: "rgba(251,113,133,0.6)", bg: "rgba(251,113,133,0.15)", text: "#fb7185" },
  活発: { border: "rgba(255,210,48,0.6)", bg: "rgba(255,210,48,0.15)", text: "#fcd34d" },
  憂鬱: { border: "rgba(167,139,250,0.6)", bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
};

const ELEMENT_ICON_MAP: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

const ROLE_ICON_MAP: Record<string, string> = {
  攻撃: "/icons/attack.png",
  守備: "/icons/defense.png",
  支援: "/icons/support.png",
};

const POSITION_ICON_MAP: Record<string, string> = {
  前列: "/icons/front.png",
  中列: "/icons/middle.png",
  後列: "/icons/back.png",
};

const ATTACK_TYPE_ICON_MAP: Record<string, string> = {
  物理: "/icons/physical.png",
  魔法: "/icons/magical.png",
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
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

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
  const skills = Array.isArray(character.skills) ? (character.skills as Array<Record<string, unknown>>) : null;

  const elemColors = character.element ? ELEMENT_COLORS[character.element] : null;

  return (
    <div className="space-y-6">
      {/* ヒーローエリア */}
      <div className="flex items-start gap-4">
        {/* キャラ画像 モバイル96px / PC160px */}
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[10px] md:h-56 md:w-56 md:rounded-[16px]"
          style={{
            border: `1.2px solid ${elemColors?.border ?? "rgba(249,168,212,0.2)"}`,
            backgroundColor: elemColors?.bg ?? "transparent",
          }}
        >
          {character.imageUrl ? (
            <Image
              src={character.imageUrl}
              alt={character.name}
              width={224}
              height={224}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-lg text-text-tertiary md:text-2xl">
              {character.name.charAt(0)}
            </div>
          )}
        </div>

        {/* キャラ情報 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#fce7f3]">
              {character.name}
            </h1>
            {character.rarity && (
              <span className="text-base text-[#facc15]">
                {"★".repeat(parseInt(character.rarity.replace(/[^0-9]/g, "")) || 0)}
              </span>
            )}
          </div>

          {/* タグ行 */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {character.element && ELEMENT_ICON_MAP[character.element] && (
              <span className="flex items-center gap-1 rounded-[4px] bg-[#2a1f3d] px-2 py-0.5 text-xs text-[#a893c0]">
                <Image src={ELEMENT_ICON_MAP[character.element]} alt={character.element} width={14} height={14} />
                {character.element}
              </span>
            )}
            {character.role && ROLE_ICON_MAP[character.role] && (
              <span className="flex items-center gap-1 rounded-[4px] bg-[#2a1f3d] px-2 py-0.5 text-xs text-[#a893c0]">
                <Image src={ROLE_ICON_MAP[character.role]} alt={character.role} width={14} height={14} />
                {character.role}
              </span>
            )}
            {character.position && POSITION_ICON_MAP[character.position] && (
              <span className="flex items-center gap-1 rounded-[4px] bg-[#2a1f3d] px-2 py-0.5 text-xs text-[#a893c0]">
                <Image src={POSITION_ICON_MAP[character.position]} alt={character.position} width={14} height={14} />
                {character.position}
              </span>
            )}
            {character.attackType && ATTACK_TYPE_ICON_MAP[character.attackType] && (
              <span className="flex items-center gap-1 rounded-[4px] bg-[#2a1f3d] px-2 py-0.5 text-xs text-[#a893c0]">
                <Image src={ATTACK_TYPE_ICON_MAP[character.attackType]} alt={character.attackType} width={14} height={14} />
                {character.attackType}
              </span>
            )}
            {character.race && (
              <span className="rounded-[4px] bg-[#2a1f3d] px-2 py-0.5 text-xs text-[#a893c0]">
                {character.race}
              </span>
            )}
            {character.isProvisional && (
              <span className="rounded-[4px] bg-[#2a1f3d] px-2 py-0.5 text-xs font-bold text-[#facc15]">
                暫定
              </span>
            )}
          </div>

          {/* 評価 */}
          {character.avgRating !== null && character.validVotesCount >= 4 ? (
            <div className="mt-2 flex items-center gap-3">
              <StarRatingDisplay rating={character.avgRating} size="md" />
              <span className="text-2xl font-bold text-[#fce7f3]">
                {character.avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-[#a893c0]">
                {character.validVotesCount}票
              </span>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#a893c0]">
              {character.validVotesCount > 0
                ? `${character.validVotesCount}票（順位対象外）`
                : "まだ投票がありません"}
            </p>
          )}
        </div>
      </div>

      {/* スキル (アコーディオン) */}
      <section className="border-t border-[rgba(249,168,212,0.1)] pt-3">
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setSkillsOpen(!skillsOpen)}
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[#a893c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
            <span className="text-sm font-bold text-[#fce7f3]">スキル</span>
          </div>
          <svg
            className={`h-4 w-4 text-[#8b7aab] transition-transform ${skillsOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {skillsOpen && (
          <div className="mt-3 space-y-2">
            {SKILL_CATEGORIES.map((cat) => {
              const skillData = skills?.find((s) => s.category === cat.key) as Record<string, unknown> | undefined;
              if (!skillData) return (
                <div key={cat.key} className="overflow-hidden rounded-[10px] border border-[rgba(249,168,212,0.1)]">
                  <div className="flex items-center gap-2 bg-[rgba(36,27,53,0.7)] px-3 py-2">
                    <span className="shrink-0 rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] font-bold text-[#c4b5d4]">{cat.label}</span>
                    <span className="text-xs text-[#8b7aab]">—</span>
                  </div>
                </div>
              );
              return (
                <div key={cat.key} className="overflow-hidden rounded-[10px] border border-[rgba(249,168,212,0.1)]">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 bg-[rgba(36,27,53,0.7)] px-3 py-2">
                    <span className="shrink-0 rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] font-bold text-[#c4b5d4]">{cat.label}</span>
                    {cat.hasName && typeof skillData.name === "string" && (
                      <span className="text-sm font-bold text-white">{skillData.name}</span>
                    )}
                    {cat.hasCooltime && typeof skillData.cooltime === "number" && (
                      <span className="rounded bg-[rgba(249,168,212,0.12)] px-1.5 py-0.5 text-[10px] font-medium text-[#c4b5d4]">
                        CT {skillData.cooltime}秒
                      </span>
                    )}
                  </div>
                  {(typeof skillData.description === "string" || (typeof skillData.params === "string" && skillData.params !== "")) && (
                    <div className="bg-[rgba(20,15,35,0.6)] px-3 py-2.5">
                      {typeof skillData.description === "string" && (
                        <p className="whitespace-pre-line text-xs leading-relaxed text-[#c4b5d4]">
                          <StyledText text={skillData.description as string} />
                        </p>
                      )}
                      {typeof skillData.params === "string" && skillData.params !== "" && (
                        <ul className="mt-3 space-y-0.5 border-l-2 border-[rgba(249,168,212,0.25)] pl-2.5">
                          {(skillData.params as string).split("\n").filter(Boolean).map((line, i) => (
                            <li key={i} className="text-[11px] leading-relaxed text-[#c4b5d4]"><ParamLine text={line} /></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 普通攻撃セクション — 1カードにまとめる */}
            {(() => {
              const basicAttack = skills?.find((s) => s.category === "normal_attack_basic") as Record<string, unknown> | undefined;
              const enhancedAttack = skills?.find((s) => s.category === "normal_attack_enhanced") as Record<string, unknown> | undefined;
              if (!basicAttack && !enhancedAttack) {
                return (
                  <div className="overflow-hidden rounded-[10px] border border-[rgba(249,168,212,0.1)]">
                    <div className="flex items-center gap-2 bg-[rgba(36,27,53,0.7)] px-3 py-2">
                      <span className="shrink-0 rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] font-bold text-[#c4b5d4]">普通攻撃</span>
                      <span className="text-xs text-[#8b7aab]">—</span>
                    </div>
                  </div>
                );
              }
              const hasBoth = !!basicAttack && !!enhancedAttack;
              const renderAttackBody = (data: Record<string, unknown>) => (
                <>
                  {typeof data.description === "string" && (
                    <p className="whitespace-pre-line text-xs leading-relaxed text-[#c4b5d4]">
                      <StyledText text={data.description as string} />
                    </p>
                  )}
                  {typeof data.params === "string" && data.params !== "" && (
                    <ul className="mt-3 space-y-0.5 border-l-2 border-[rgba(249,168,212,0.25)] pl-2.5">
                      {(data.params as string).split("\n").filter(Boolean).map((line, i) => (
                        <li key={i} className="text-[11px] leading-relaxed text-[#c4b5d4]"><ParamLine text={line} /></li>
                      ))}
                    </ul>
                  )}
                </>
              );
              return (
                <div className="overflow-hidden rounded-[10px] border border-[rgba(249,168,212,0.1)]">
                  <div className="flex items-center bg-[rgba(36,27,53,0.7)] px-3 py-2">
                    <span className="rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] font-bold text-[#c4b5d4]">普通攻撃</span>
                  </div>
                  <div className="bg-[rgba(20,15,35,0.6)] px-3 pb-2.5 pt-1.5">
                    {hasBoth ? (
                      <div className="flex flex-col divide-y divide-[rgba(249,168,212,0.08)]">
                        {basicAttack && (
                          <div className="pb-2.5">
                            <span className="mb-1.5 inline-block rounded border border-[rgba(249,168,212,0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[#fce7f3]/70">基本</span>
                            {renderAttackBody(basicAttack)}
                          </div>
                        )}
                        {enhancedAttack && (
                          <div className="pt-2.5">
                            <span className="mb-1.5 inline-block rounded border border-[rgba(249,168,212,0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[#fce7f3]/70">強化</span>
                            {renderAttackBody(enhancedAttack)}
                          </div>
                        )}
                      </div>
                    ) : (
                      renderAttackBody((basicAttack ?? enhancedAttack)!)
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* アルバイトアイテム */}
      {partTimeItem && (
        <div className="border-t border-[rgba(249,168,212,0.1)] pt-3">
          <p className="text-xs text-[#a893c0]">
            アルバイトアイテム: <span className="font-bold text-[#fce7f3]">{partTimeItem}</span>
          </p>
        </div>
      )}

      {/* 投稿フォーム */}
      <section className="space-y-3">
        <div className="rounded-[14px] bg-gradient-to-r from-[rgba(246,51,154,0.1)] to-[rgba(255,32,86,0.1)] border border-[rgba(251,100,182,0.3)] p-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#fce7f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-sm font-bold text-[#fce7f3]">
                  {character.name}を評価する
                </span>
              </div>
              <p className="mt-1 text-xs text-[#8b7aab]">★評価とコメントを投稿できます</p>
            </div>
            <button
              onClick={() => setFormOpen(!formOpen)}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#fb64b6] to-[#ff637e] px-5 py-3 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              投稿する
            </button>
          </div>
        </div>
        {formOpen && (
          <CommentForm
            onSubmit={handleSubmit}
            showRating
            loading={submitLoading}
          />
        )}
      </section>

      {/* コメント一覧 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[#a893c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-bold text-[#fce7f3]">
              コメント ({totalCount})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSortChange("newest")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                sortTab === "newest"
                  ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                  : "border-[rgba(139,122,171,0.3)] text-[#8b7aab] hover:text-[#c4b5d4]"
              )}
            >
              新着順
            </button>
            <button
              onClick={() => handleSortChange("thumbs_up")}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                sortTab === "thumbs_up"
                  ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                  : "border-[rgba(139,122,171,0.3)] text-[#8b7aab] hover:text-[#c4b5d4]"
              )}
            >
              <svg className="h-3 w-3 text-[#fb64b6]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
              </svg>
              順
            </button>
            <button
              onClick={() => handleSortChange("thumbs_down")}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                sortTab === "thumbs_down"
                  ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                  : "border-[rgba(139,122,171,0.3)] text-[#8b7aab] hover:text-[#c4b5d4]"
              )}
            >
              <svg className="h-3 w-3 text-[#60a5fa]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V6.34C17 5.05 15.95 4 14.66 4h-8.1c-.71 0-1.36.37-1.72.97l-2.67 6.15z" />
              </svg>
              順
            </button>
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
          hideTab
        />
      </section>

      {/* 回遊エリア: 関連キャラ */}
      {relatedCharacters.length > 0 && (
        <section className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#a893c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-bold text-[#fce7f3]">次に見る</span>
            </div>
            <p className="mt-0.5 text-xs text-[#8b7aab]">同じ性格・レアリティのキャラ</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {relatedCharacters.map((c) => (
              <CharacterCard
                key={c.id}
                slug={c.slug}
                name={c.name}
                imageUrl={c.imageUrl}
                avgRating={c.avgRating}
                validVotesCount={c.validVotesCount}
              />
            ))}
          </div>
        </section>
      )}

      {/* ページ下部ナビリンク */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-[#a893c0]">他のランキングもチェック</p>
        <Link
          href="/ranking"
          className="flex items-center gap-3 rounded-[14px] bg-gradient-to-r from-[rgba(255,185,0,0.15)] to-[rgba(255,137,4,0.15)] border border-[rgba(249,168,212,0.1)] px-4 py-3 transition-colors hover:from-[rgba(255,185,0,0.25)] hover:to-[rgba(255,137,4,0.25)] cursor-pointer"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
            style={{ backgroundImage: "linear-gradient(135deg, #ffb900, #ff8904)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
          </span>
          <div className="flex-1">
            <span className="block text-sm font-bold text-[#fce7f3]">人気キャラランキング</span>
            <span className="text-[10px] text-[#8b7aab]">投票で決まる最強キャラをチェック</span>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[#8b7aab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/builds"
          className="flex items-center gap-3 rounded-[14px] bg-gradient-to-r from-[rgba(251,100,182,0.15)] to-[rgba(255,99,126,0.15)] border border-[rgba(249,168,212,0.1)] px-4 py-3 transition-colors hover:from-[rgba(251,100,182,0.25)] hover:to-[rgba(255,99,126,0.25)] cursor-pointer"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
            style={{ backgroundImage: "linear-gradient(135deg, #fb64b6, #ff637e)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </span>
          <div className="flex-1">
            <span className="block text-sm font-bold text-[#fce7f3]">編成ランキング</span>
            <span className="text-[10px] text-[#8b7aab]">人気のパーティ編成をチェックしよう</span>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[#8b7aab]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
