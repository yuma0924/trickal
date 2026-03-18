"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CharacterCard } from "@/components/character/character-card";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { cn } from "@/lib/utils";
import { useToast, Toast } from "@/components/ui/toast";
import type { CharacterDetail, RelatedCharacter } from "./page";


/** パラメータ行の「ラベル: 値」を分割し、値部分にアクセント色を適用 */
function ParamLine({ text }: { text: string }) {
  // 「ラベル: 値」形式
  const colonMatch = text.match(/^(.+?)([：:]\s*)(.+)$/);
  if (colonMatch) {
    const [, label, sep, value] = colonMatch;
    return (
      <>
        <span>{label}{sep}</span>
        <span className="font-medium text-[#fcd34d]">{value}</span>
      </>
    );
  }
  // 「ラベル +数値%」形式（コロンなし）
  const numMatch = text.match(/^(.+?\s)([+\-−][\d.]+%?.*)$/);
  if (numMatch) {
    const [, label, value] = numMatch;
    return (
      <>
        <span>{label}</span>
        <span className="font-medium text-[#fcd34d]">{value}</span>
      </>
    );
  }
  return <>{text}</>;
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

/** PC版ヒーロー右側の追加情報チップ（画像+ラベル+名前） */
function InfoChip({ label, name, imageUrl, description, params }: {
  label: string;
  name?: string;
  imageUrl?: string | null;
  description?: string;
  params?: string;
}) {
  if (!name) return null;
  const paramLines = params?.split("\n").filter(Boolean) ?? [];
  return (
    <div className="w-48 rounded-[10px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] px-3 py-2.5">
      <p className="text-[10px] text-[#9e99a7]">{label}</p>
      <div className="mt-1.5 flex items-center gap-2.5">
        {imageUrl && (
          <Image src={imageUrl} alt={name} width={36} height={36} className="shrink-0 rounded-md" />
        )}
        <p className="text-sm font-bold leading-snug text-[#fafafa]">{name}</p>
      </div>
      {paramLines.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-l-2 border-[rgba(249,168,212,0.25)] pl-2">
          {paramLines.map((line, i) => (
            <li key={i} className="text-[11px] leading-relaxed text-[#d4d0de]">
              <ParamLine text={line} />
            </li>
          ))}
        </ul>
      )}
      {description && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#c0bbc8]">{description}</p>
      )}
    </div>
  );
}

type SortTab = "newest" | "thumbs_up";
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
  const [, setUserHash] = useState<string | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [extraInfoOpen, setExtraInfoOpen] = useState(false);
  const { toast, showToast } = useToast();

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
        fetchComments(sortTab);
        setFormOpen(false);
        showToast("投稿しました！");
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

  // スキル情報
  const skills = Array.isArray(character.skills) ? (character.skills as Array<Record<string, unknown>>) : null;

  const elemColors = character.element ? ELEMENT_COLORS[character.element] : null;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ヒーローエリア */}
      <div className="flex items-start gap-4 md:gap-6">
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
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl md:text-2xl font-bold text-[#fafafa]">
              {character.name}
            </h1>
            {character.element && ELEMENT_ICON_MAP[character.element] && (
              <Image src={ELEMENT_ICON_MAP[character.element]} alt={character.element} width={22} height={22} className="shrink-0 md:h-6 md:w-6" />
            )}
          </div>

          {/* タグ行 */}
          <div className="mt-1.5 md:mt-2 flex flex-wrap items-center gap-1 md:gap-1.5">
            {character.role && ROLE_ICON_MAP[character.role] && (
              <span className="flex items-center gap-1 rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[13px] md:px-2 md:py-1 md:text-sm text-[#c0bbc8]">
                <Image src={ROLE_ICON_MAP[character.role]} alt={character.role} width={15} height={15} className="md:h-[18px] md:w-[18px]" />
                {character.role}
              </span>
            )}
            {character.position && POSITION_ICON_MAP[character.position] && (
              <span className="flex items-center gap-1 rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[13px] md:px-2 md:py-1 md:text-sm text-[#c0bbc8]">
                <Image src={POSITION_ICON_MAP[character.position]} alt={character.position} width={15} height={15} className="md:h-[18px] md:w-[18px]" />
                {character.position}
              </span>
            )}
            {character.attackType && ATTACK_TYPE_ICON_MAP[character.attackType] && (
              <span className="flex items-center gap-1 rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[13px] md:px-2 md:py-1 md:text-sm text-[#c0bbc8]">
                <Image src={ATTACK_TYPE_ICON_MAP[character.attackType]} alt={character.attackType} width={15} height={15} className="md:h-[18px] md:w-[18px]" />
                {character.attackType}
              </span>
            )}
            {character.race && (
              <span className="rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[13px] md:px-2 md:py-1 md:text-sm text-[#c0bbc8]">
                {character.race}
              </span>
            )}
            {character.isProvisional && (
              <span className="rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[13px] md:px-2 md:py-1 md:text-sm font-bold text-[#facc15]">
                暫定
              </span>
            )}
          </div>

          {/* 評価 */}
          {character.avgRating !== null && character.validVotesCount >= 1 ? (
            <div className="mt-2.5 md:mt-3 flex items-center">
              <StarRatingDisplay rating={character.avgRating} size="lg" />
            </div>
          ) : (
            <p className="mt-1.5 text-xs md:text-sm text-[#c0bbc8]">
              {character.validVotesCount > 0
                ? `${character.validVotesCount}票（順位対象外）`
                : "まだ投票がありません"}
            </p>
          )}

          {/* PC版 追加情報（遺物・好物・アルバイト報酬） */}
          {(character.relic || character.favoriteItem || character.partTimeReward) && (
            <div className="mt-4 hidden gap-3 md:flex md:flex-wrap">
              <InfoChip label="愛用遺物" name={character.relic?.name} imageUrl={character.relic?.imageUrl} description={character.relic?.description} params={character.relic?.params} />
              <InfoChip label="好物" name={character.favoriteItem?.name} imageUrl={character.favoriteItem?.imageUrl} />
              <InfoChip label="アルバイト報酬" name={character.partTimeReward?.name} imageUrl={character.partTimeReward?.imageUrl} />
            </div>
          )}
        </div>
      </div>

      {/* モバイル版 愛用遺物（スキルの上） */}
      {character.relic && (
        <div className="md:hidden border-t border-[rgba(249,168,212,0.1)] pt-3">
          <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] px-3 py-2.5">
            {character.relic.imageUrl && (
              <Image src={character.relic.imageUrl} alt={character.relic.name} width={44} height={44} className="shrink-0 rounded-md" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] text-[#9e99a7]">愛用遺物</p>
              <p className="text-sm font-bold text-[#fafafa]">{character.relic.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* モバイル版 好物・アルバイト報酬（展開式） */}
      {(character.favoriteItem || character.partTimeReward) && (
        <div className="md:hidden border-t border-[rgba(249,168,212,0.1)] pt-3">
          <button
            className="flex w-full cursor-pointer items-center justify-between py-1 text-xs font-medium text-[#9e99a7] transition-colors hover:text-[#d4d0de]"
            onClick={() => setExtraInfoOpen(!extraInfoOpen)}
          >
            <span>好物・アルバイト報酬</span>
            <svg
              className={`h-3.5 w-3.5 transition-transform ${extraInfoOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {extraInfoOpen && (
            <div className="mt-2 flex flex-col gap-2">
              {character.favoriteItem && (
                <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] px-3 py-2">
                  {character.favoriteItem.imageUrl && (
                    <Image src={character.favoriteItem.imageUrl} alt={character.favoriteItem.name} width={28} height={28} className="shrink-0 rounded" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#9e99a7]">好物</p>
                    <p className="text-xs font-bold text-[#fafafa]">{character.favoriteItem.name}</p>
                  </div>
                </div>
              )}
              {character.partTimeReward && (
                <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] px-3 py-2">
                  {character.partTimeReward.imageUrl && (
                    <Image src={character.partTimeReward.imageUrl} alt={character.partTimeReward.name} width={28} height={28} className="shrink-0 rounded" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#9e99a7]">アルバイト報酬</p>
                    <p className="text-xs font-bold text-[#fafafa]">{character.partTimeReward.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* スキル (チラ見せ + 展開) */}
      <section className="md:max-w-2xl border-t border-[rgba(249,168,212,0.1)] pt-3">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 md:h-5 md:w-5 text-[#c0bbc8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
          </svg>
          <span className="text-sm md:text-base font-bold text-[#fafafa]">スキル</span>
        </div>
        <div className="relative">
          <div
            className={cn(
              "space-y-2 overflow-hidden transition-[max-height] duration-300",
              skillsOpen ? "max-h-[2000px]" : "max-h-28"
            )}
          >
            {SKILL_CATEGORIES.map((cat) => {
              const skillData = skills?.find((s) => s.category === cat.key) as Record<string, unknown> | undefined;
              if (!skillData) return (
                <div key={cat.key} className="overflow-hidden rounded-[10px] border border-[rgba(249,168,212,0.1)]">
                  <div className="flex items-center gap-2 bg-[rgba(36,27,53,0.7)] px-3 py-2">
                    <span className="shrink-0 rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] md:text-xs font-bold text-[#d4d0de]">{cat.label}</span>
                    <span className="text-xs text-[#9e99a7]">—</span>
                  </div>
                </div>
              );
              return (
                <div key={cat.key} className="overflow-hidden rounded-[10px] border border-[rgba(249,168,212,0.1)]">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 bg-[rgba(36,27,53,0.7)] px-3 py-2">
                    <span className="shrink-0 rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] md:text-xs font-bold text-[#d4d0de]">{cat.label}</span>
                    {cat.hasName && typeof skillData.name === "string" && (
                      <span className="text-sm font-bold text-white">{skillData.name}</span>
                    )}
                    {cat.hasCooltime && typeof skillData.cooltime === "number" && (
                      <span className="rounded bg-[rgba(249,168,212,0.12)] px-1.5 py-0.5 text-[10px] font-medium text-[#d4d0de]">
                        CT {skillData.cooltime}秒
                      </span>
                    )}
                  </div>
                  {(typeof skillData.description === "string" || (typeof skillData.params === "string" && skillData.params !== "")) && (
                    <div className="bg-[rgba(20,15,35,0.6)] px-3 py-2.5">
                      {typeof skillData.description === "string" && (
                        <p className="whitespace-pre-line text-xs md:text-sm leading-relaxed text-[#d4d0de]">
                          <StyledText text={skillData.description as string} />
                        </p>
                      )}
                      {typeof skillData.params === "string" && skillData.params !== "" && (
                        <ul className="mt-3 space-y-0.5 border-l-2 border-[rgba(249,168,212,0.25)] pl-2.5">
                          {(skillData.params as string).split("\n").filter(Boolean).map((line, i) => (
                            <li key={i} className="text-[11px] md:text-xs leading-relaxed text-[#d4d0de]"><ParamLine text={line} /></li>
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
                      <span className="shrink-0 rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] md:text-xs font-bold text-[#d4d0de]">普通攻撃</span>
                      <span className="text-xs text-[#9e99a7]">—</span>
                    </div>
                  </div>
                );
              }
              const hasBoth = !!basicAttack && !!enhancedAttack;
              const renderAttackBody = (data: Record<string, unknown>) => (
                <>
                  {typeof data.description === "string" && (
                    <p className="whitespace-pre-line text-xs md:text-sm leading-relaxed text-[#d4d0de]">
                      <StyledText text={data.description as string} />
                    </p>
                  )}
                  {typeof data.params === "string" && data.params !== "" && (
                    <ul className="mt-3 space-y-0.5 border-l-2 border-[rgba(249,168,212,0.25)] pl-2.5">
                      {(data.params as string).split("\n").filter(Boolean).map((line, i) => (
                        <li key={i} className="text-[11px] md:text-xs leading-relaxed text-[#d4d0de]"><ParamLine text={line} /></li>
                      ))}
                    </ul>
                  )}
                </>
              );
              return (
                <div className="overflow-hidden rounded-[10px] border border-[rgba(249,168,212,0.1)]">
                  <div className="flex items-center bg-[rgba(36,27,53,0.7)] px-3 py-2">
                    <span className="rounded border border-[rgba(249,168,212,0.2)] px-1.5 py-0.5 text-[11px] md:text-xs font-bold text-[#d4d0de]">普通攻撃</span>
                  </div>
                  <div className="bg-[rgba(20,15,35,0.6)] px-3 pb-2.5 pt-1.5">
                    {hasBoth ? (
                      <div className="flex flex-col divide-y divide-[rgba(249,168,212,0.08)]">
                        {basicAttack && (
                          <div className="pb-2.5">
                            <span className="mb-1.5 inline-block rounded border border-[rgba(249,168,212,0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[#fafafa]/70">基本</span>
                            {renderAttackBody(basicAttack)}
                          </div>
                        )}
                        {enhancedAttack && (
                          <div className="pt-2.5">
                            <span className="mb-1.5 inline-block rounded border border-[rgba(249,168,212,0.15)] px-1.5 py-0.5 text-[10px] font-bold text-[#fafafa]/70">強化</span>
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
          {/* グラデーションオーバーレイ（閉じてる時のみ） */}
          {!skillsOpen && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0a14] to-transparent" />
          )}
        </div>
        <button
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#9e99a7] transition-colors hover:text-[#d4d0de]"
          onClick={() => setSkillsOpen(!skillsOpen)}
        >
          {skillsOpen ? "スキルを閉じる" : "スキルをすべて表示"}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${skillsOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>

      {/* 投稿フォーム */}
      <section>
        {!formOpen ? (
          <div className="md:max-w-[82%] rounded-[14px] bg-gradient-to-r from-[rgba(246,51,154,0.1)] to-[rgba(255,32,86,0.1)] border border-[rgba(251,100,182,0.3)] p-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#fafafa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="text-sm md:text-base font-bold text-[#fafafa]">
                    {character.name}を評価する
                  </span>
                </div>
                <p className="mt-1 text-xs md:text-sm text-[#9e99a7]">★評価とコメントを投稿できます</p>
              </div>
              <button
                onClick={() => setFormOpen(true)}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#fb64b6] to-[#ff637e] px-5 md:px-7 py-3 text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                投稿する
              </button>
            </div>
          </div>
        ) : (
          <CommentForm
            onSubmit={handleSubmit}
            onClose={() => setFormOpen(false)}
            showRating
            loading={submitLoading}
          />
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
              コメント ({totalCount})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSortChange("newest")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs md:text-sm md:px-3 md:py-1.5 font-medium transition-colors",
                sortTab === "newest"
                  ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                  : "border-[rgba(139,122,171,0.3)] text-[#9e99a7] hover:text-[#d4d0de]"
              )}
            >
              新着順
            </button>
            <button
              onClick={() => handleSortChange("thumbs_up")}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs md:text-sm md:px-3 md:py-1.5 font-medium transition-colors",
                sortTab === "thumbs_up"
                  ? "border-[rgba(251,100,182,0.4)] bg-[rgba(251,100,182,0.12)] text-[#fb64b6]"
                  : "border-[rgba(139,122,171,0.3)] text-[#9e99a7] hover:text-[#d4d0de]"
              )}
            >
              <svg className="h-3 w-3 text-[#fb64b6]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
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
          accentColor="#34d399"
          hideTab
        />
      </section>

      {/* 回遊エリア: 関連キャラ */}
      {relatedCharacters.length > 0 && (
        <section className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 md:h-5 md:w-5 text-[#c0bbc8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm md:text-base font-bold text-[#fafafa]">次に見る</span>
            </div>
            <p className="mt-0.5 text-xs md:text-sm text-[#9e99a7]">同じ性格・レアリティのキャラ</p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
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
        <p className="text-xs md:text-sm font-bold text-[#c0bbc8]">他のランキングもチェック</p>
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
            <span className="block text-sm md:text-base font-bold text-[#fafafa]">人気キャラランキング</span>
            <span className="text-[10px] md:text-xs text-[#9e99a7]">投票で決まる最強キャラをチェック</span>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[#9e99a7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <span className="block text-sm md:text-base font-bold text-[#fafafa]">編成ランキング</span>
            <span className="text-[10px] md:text-xs text-[#9e99a7]">人気のパーティ編成をチェックしよう</span>
          </div>
          <svg className="h-4 w-4 shrink-0 text-[#9e99a7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
