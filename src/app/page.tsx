import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { CharacterCard } from "@/components/character/character-card";
import type { Element } from "@/lib/constants";
import { HomeSearchSection } from "./home-search-section";
import { HomeBuildsSection } from "./home-builds-section";

interface RankedChar {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  role: string | null;
  position: string | null;
  attackType: string | null;
  race: string | null;
  rarity: string | null;
  imageUrl: string | null;
  avgRating: number;
  validVotesCount: number;
  boardCommentsCount: number;
  rank: number;
  featuredComment: string | null;
  featuredCommentAuthor: string | null;
  featuredCommentThumbsUp: number;
}

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

const ELEMENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  純粋: { border: "rgba(74,222,128,0.6)", bg: "rgba(74,222,128,0.15)", text: "#34d399" },
  冷静: { border: "rgba(56,189,248,0.6)", bg: "rgba(56,189,248,0.15)", text: "#38bdf8" },
  狂気: { border: "rgba(251,113,133,0.6)", bg: "rgba(251,113,133,0.15)", text: "#fb7185" },
  活発: { border: "rgba(255,210,48,0.6)", bg: "rgba(255,210,48,0.15)", text: "#fcd34d" },
  憂鬱: { border: "rgba(166,132,255,0.6)", bg: "rgba(166,132,255,0.15)", text: "#a78bfa" },
};

interface TrendingChar {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  commentCount: number;
  avgRating: number | null;
  validVotesCount: number;
  latestComment: string | null;
  latestCommentAuthor: string | null;
  latestCommentThumbsUp: number;
}

/* ===== セクション見出し共通 ===== */
function SectionHeading({
  icon,
  title,
  subtitle,
  href,
  linkLabel,
  gradientFrom,
  gradientTo,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
            style={{ backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            {icon}
          </span>
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        </div>
        {href && linkLabel && (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-0.5 text-sm text-[#f9a8d4] transition-colors hover:text-accent cursor-pointer"
          >
            {linkLabel}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
      {subtitle && (
        <p className="mt-1.5 pl-2.5 text-xs text-text-muted">{subtitle}</p>
      )}
    </div>
  );
}

/* ===== セクション末尾ワイドボタン ===== */
function SectionFooterButton({
  href,
  label,
  gradientFrom,
  gradientTo,
}: {
  href: string;
  label: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer lg:max-w-sm lg:mx-auto"
      style={{
        backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
      }}
    >
      {label}
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ===== アイコン ===== */
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
    </svg>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  );
}


export default async function Home() {
  const supabase = await createServerClient();

  // --- 第1段: 人気キャラランキング (上位15件) ---
  const { data: rankings } = await supabase
    .from("character_rankings")
    .select(
      "character_id, avg_rating, valid_votes_count, board_comments_count, rank"
    )
    .not("rank", "is", null)
    .gte("valid_votes_count", 1)
    .order("rank", { ascending: true })
    .limit(15);

  const { data: characters } = await supabase
    .from("characters")
    .select("id, slug, name, element, role, position, attack_type, race, rarity, image_url")
    .eq("is_hidden", false);

  const charMap = new Map<
    string,
    {
      slug: string;
      name: string;
      element: string | null;
      role: string | null;
      position: string | null;
      attackType: string | null;
      race: string | null;
      rarity: string | null;
      imageUrl: string | null;
    }
  >();
  if (characters) {
    for (const c of characters) {
      charMap.set(c.id, {
        slug: c.slug,
        name: c.name,
        element: c.element,
        role: c.role,
        position: c.position,
        attackType: c.attack_type,
        race: c.race,
        rarity: c.rarity,
        imageUrl: c.image_url,
      });
    }
  }

  // 注目コメント取得（各キャラの上位1件）
  const rankedCharIds = (rankings ?? []).map((r) => r.character_id);

  const { data: featuredComments } =
    rankedCharIds.length > 0
      ? await supabase
          .from("comments")
          .select("character_id, body, display_name, thumbs_up_count")
          .in("character_id", rankedCharIds)
          .eq("comment_type", "vote")
          .eq("is_latest_vote", true)
          .eq("is_deleted", false)
          .gte("rating", 3.0)
          .order("created_at", { ascending: false })
      : { data: [] };

  const featuredMap = new Map<string, { body: string; author: string; thumbsUp: number }>();
  if (featuredComments) {
    for (const fc of featuredComments) {
      if (!featuredMap.has(fc.character_id) && fc.body) {
        featuredMap.set(fc.character_id, {
          body: fc.body,
          author: fc.display_name || "名無し",
          thumbsUp: fc.thumbs_up_count ?? 0,
        });
      }
    }
  }

  // フォールバック
  const missingIds = rankedCharIds.filter((id) => !featuredMap.has(id));
  if (missingIds.length > 0) {
    const { data: fallbackComments } = await supabase
      .from("comments")
      .select("character_id, body, display_name, thumbs_up_count")
      .in("character_id", missingIds)
      .eq("is_deleted", false)
      .order("thumbs_up_count", { ascending: false })
      .order("created_at", { ascending: false });

    if (fallbackComments) {
      for (const fc of fallbackComments) {
        if (!featuredMap.has(fc.character_id) && fc.body) {
          featuredMap.set(fc.character_id, {
            body: fc.body,
            author: fc.display_name || "名無し",
            thumbsUp: fc.thumbs_up_count ?? 0,
          });
        }
      }
    }
  }

  const rankedCharacters: RankedChar[] = (rankings ?? [])
    .map((r) => {
      const char = charMap.get(r.character_id);
      if (!char || r.rank === null) return null;
      const featured = featuredMap.get(r.character_id);
      return {
        id: r.character_id,
        slug: char.slug,
        name: char.name,
        element: char.element as Element | null,
        role: char.role,
        position: char.position,
        attackType: char.attackType,
        race: char.race,
        rarity: char.rarity,
        imageUrl: char.imageUrl,
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
        boardCommentsCount: r.board_comments_count,
        rank: r.rank,
        featuredComment: featured?.body ?? null,
        featuredCommentAuthor: featured?.author ?? null,
        featuredCommentThumbsUp: featured?.thumbsUp ?? 0,
      };
    })
    .filter((c): c is RankedChar => c !== null);

  const topChar = rankedCharacters[0] ?? null;

  // --- 第2段: 話題のキャラクター ---
  // 直近24時間 → 7日間 → 30日間とフォールバック
  let recentComments: { character_id: string; user_hash: string; body: string | null; display_name: string | null; thumbs_up_count: number | null }[] | null = null;
  let trendingPeriodLabel = "直近24時間";

  for (const { hours, label } of [
    { hours: 24, label: "直近24時間" },
    { hours: 7 * 24, label: "直近7日間" },
    { hours: 30 * 24, label: "直近30日間" },
  ]) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("comments")
      .select("character_id, user_hash, body, display_name, thumbs_up_count")
      .eq("is_deleted", false)
      .gte("created_at", since);
    if (data && data.length > 0) {
      recentComments = data;
      trendingPeriodLabel = label;
      break;
    }
  }

  const trendingMap = new Map<string, number>();
  const userCharCountMap = new Map<string, number>();
  const trendingCommentMap = new Map<
    string,
    { body: string; author: string; thumbsUp: number }
  >();

  if (recentComments) {
    for (const rc of recentComments) {
      const key = `${rc.character_id}:${rc.user_hash}`;
      const currentCount = userCharCountMap.get(key) ?? 0;
      userCharCountMap.set(key, currentCount + 1);

      if (currentCount < 3) {
        trendingMap.set(
          rc.character_id,
          (trendingMap.get(rc.character_id) ?? 0) + 1
        );
      }

      if (!trendingCommentMap.has(rc.character_id) && rc.body) {
        trendingCommentMap.set(rc.character_id, {
          body: rc.body,
          author: rc.display_name || "名無し",
          thumbsUp: rc.thumbs_up_count ?? 0,
        });
      }
    }
  }

  const trendingEntries = Array.from(trendingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // ランキングマップ（話題キャラの評価表示用）
  const rankingMapForTrending = new Map<string, { avgRating: number; validVotesCount: number }>();
  if (rankings) {
    for (const r of rankings) {
      rankingMapForTrending.set(r.character_id, {
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
      });
    }
  }

  const trendingCharacters: TrendingChar[] = trendingEntries
    .map(([id, count]) => {
      const char = charMap.get(id);
      if (!char) return null;
      const comment = trendingCommentMap.get(id);
      const rr = rankingMapForTrending.get(id);
      return {
        id,
        slug: char.slug,
        name: char.name,
        element: char.element as Element | null,
        imageUrl: char.imageUrl,
        commentCount: count,
        avgRating: rr?.avgRating ?? null,
        validVotesCount: rr?.validVotesCount ?? 0,
        latestComment: comment?.body ?? null,
        latestCommentAuthor: comment?.author ?? null,
        latestCommentThumbsUp: comment?.thumbsUp ?? 0,
      };
    })
    .filter((c): c is TrendingChar => c !== null);

  // --- 第3段: 編成ランキング（フィルター用に多めに取得）---
  const { data: topBuilds } = await supabase
    .from("builds")
    .select(
      "id, mode, members, element_label, title, display_name, comment, likes_count, dislikes_count, updated_at, build_comments(count)"
    )
    .eq("is_deleted", false)
    .order("likes_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(30);

  // --- 第4段: キャラ検索・フィルターのデータ ---
  const { data: allChars } = await supabase
    .from("characters")
    .select("id, slug, name, element, role, rarity, race, position, image_url")
    .eq("is_hidden", false);

  const searchCharacters = (allChars ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    element: c.element,
    role: c.role,
    rarity: c.rarity,
    race: c.race,
    position: c.position,
    imageUrl: c.image_url,
  }));

  // 編成ランキング用データ変換
  const buildsData = (topBuilds ?? []).map((build) => {
    const memberIds = build.members as string[];
    const memberElements = memberIds
      .map((mId) => charMap.get(mId)?.element)
      .filter((e): e is string => e !== null && e !== undefined);
    const commentCount = Array.isArray(build.build_comments) && build.build_comments.length > 0
      ? (build.build_comments[0] as { count: number }).count
      : 0;
    return {
      id: build.id,
      mode: build.mode,
      members: memberIds,
      elementLabel: build.element_label,
      title: build.title,
      displayName: build.display_name,
      comment: build.comment,
      likesCount: build.likes_count,
      dislikesCount: build.dislikes_count,
      commentCount,
      memberElements,
    };
  });

  const charMapPlain: Record<string, { name: string; element: string | null; imageUrl: string | null }> = {};
  charMap.forEach((v, k) => {
    charMapPlain[k] = { name: v.name, element: v.element, imageUrl: v.imageUrl };
  });

  return (
    <div className="space-y-10 md:space-y-14">
      {/* ====== 第1段: 人気キャラランキング ====== */}
      <section>
        <SectionHeading
          icon={<CrownIcon className="h-5 w-5 text-white" />}
          title="人気キャラランキング"
          href="/ranking"
          linkLabel="もっと見る"
          gradientFrom="#ffb900"
          gradientTo="#ff637e"
        />

        {topChar && (
          <>
            <div className="mt-2 flex items-baseline pl-4 lg:justify-between">
              <div className="text-base lg:text-lg">
                <span className="text-text-tertiary">現在の総合1位は</span>
                <span className="ml-1 font-bold text-[#fafafa]">{topChar.name}</span>
                <span className="ml-1 inline-flex -translate-y-[2px] items-center gap-0.5 align-middle">
                  <svg className="h-4 w-4 text-[#fcd34d]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="-translate-y-px font-bold text-[#fcd34d]">{topChar.avgRating.toFixed(1)}</span>
                </span>
              </div>
              <span className="hidden lg:inline text-xs text-text-muted">みんなの評価で算出 · 毎日 0:00 更新</span>
            </div>
            <p className="mt-1 pl-4 text-xs text-text-muted lg:hidden">みんなの評価で算出 · 毎日 0:00 更新</p>
          </>
        )}

        {rankedCharacters.length === 0 ? (
          <p className="mt-4 py-8 text-center text-sm text-text-tertiary">
            まだランキングデータがありません
          </p>
        ) : (
          <>
            {/* ヒーロー表示 (1-3位) */}
            <div className="mt-3 space-y-3">
              {rankedCharacters.slice(0, 3).map((char, idx) => {
                const rank = char.rank as 1 | 2 | 3;
                const elemStyle = char.element ? ELEMENT_COLORS[char.element] : null;

                // 順位ごとのカラー設定
                const rankConfig = {
                  1: {
                    borderColor: "#d4a017",
                    bannerBg: "rgba(255,185,0,0.15)",
                    rankText: "#fcd34d",
                    badge: (
                      <span className="flex h-7 w-7 items-center justify-center">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" fill="#ffd700" />
                          <path d="M5 18h14v2H5z" fill="#ffd700" />
                        </svg>
                      </span>
                    ),
                  },
                  2: {
                    borderColor: "#9ca3af",
                    bannerBg: "rgba(144,161,185,0.1)",
                    rankText: "#d1d5db",
                    badge: (
                      <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
                        <path d="M13 22l-4 6h14l-4-6" fill="#7a8fa3" />
                        <circle cx="16" cy="14" r="10" fill="#b0c4d8" stroke="#90a1b9" strokeWidth="1.5" />
                        <path d="M16 8l1.8 3.6 4 .6-2.9 2.8.7 4L16 17l-3.6 2 .7-4-2.9-2.8 4-.6L16 8z" fill="#e8eef4" stroke="#90a1b9" strokeWidth="0.5" />
                      </svg>
                    ),
                  },
                  3: {
                    borderColor: "#b45309",
                    bannerBg: "rgba(225,113,0,0.1)",
                    rankText: "#fe9a00",
                    badge: (
                      <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none">
                        <path d="M13 22l-4 6h14l-4-6" fill="#92400e" />
                        <circle cx="16" cy="14" r="10" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <path d="M16 8l1.8 3.6 4 .6-2.9 2.8.7 4L16 17l-3.6 2 .7-4-2.9-2.8 4-.6L16 8z" fill="#fde68a" stroke="#b45309" strokeWidth="0.5" />
                      </svg>
                    ),
                  },
                } as const;

                const cfg = rankConfig[rank];

                return (
                  <Link
                    key={char.id}
                    href={`/characters/${char.slug}`}
                    className="block overflow-clip rounded-[16px] bg-[rgba(36,27,53,0.95)] transition-colors hover:brightness-110 cursor-pointer"
                    style={{
                      border: `1.5px solid ${cfg.borderColor}`,
                    }}
                  >
                    {/* 順位バナー */}
                    <div
                      className="flex h-[38px] items-center gap-1.5 pl-3.5"
                      style={{ backgroundColor: cfg.bannerBg }}
                    >
                      {cfg.badge}
                      <span
                        className="text-sm font-bold"
                        style={{ color: cfg.rankText }}
                      >
                        {rank}位
                      </span>
                    </div>

                    <div className="lg:flex">
                      {/* キャラ情報 */}
                      <div className="flex gap-3 px-3.5 py-2.5 lg:flex-1 lg:min-w-0 lg:py-4 lg:px-4 lg:gap-4">
                        {/* キャラ画像 */}
                        <div className="h-20 w-20 shrink-0 overflow-hidden lg:h-24 lg:w-24">
                          {char.imageUrl ? (
                            <Image
                              src={char.imageUrl}
                              alt={char.name}
                              width={84}
                              height={84}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#2a1f3d] text-lg text-[#8b7aab]">
                              {char.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* 名前・ロール・評価 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-base font-bold text-[#fafafa] lg:text-lg">
                              {char.name}
                            </p>
                            {char.element && ELEMENT_ICON_MAP[char.element] && (
                              <Image src={ELEMENT_ICON_MAP[char.element]} alt={char.element} width={16} height={16} className="shrink-0 lg:h-5 lg:w-5" />
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1 lg:mt-1.5">
                            {char.role && ROLE_ICON_MAP[char.role] && (
                              <span className="flex items-center gap-0.5 rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[11px] text-[#a893c0]">
                                <Image src={ROLE_ICON_MAP[char.role]} alt={char.role} width={13} height={13} />
                                {char.role}
                              </span>
                            )}
                            {char.position && POSITION_ICON_MAP[char.position] && (
                              <span className="flex items-center gap-0.5 rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[11px] text-[#a893c0]">
                                <Image src={POSITION_ICON_MAP[char.position]} alt={char.position} width={13} height={13} />
                                {char.position}
                              </span>
                            )}
                            {char.attackType && ATTACK_TYPE_ICON_MAP[char.attackType] && (
                              <span className="flex items-center gap-0.5 rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[11px] text-[#a893c0]">
                                <Image src={ATTACK_TYPE_ICON_MAP[char.attackType]} alt={char.attackType} width={13} height={13} />
                                {char.attackType}
                              </span>
                            )}
                            {char.race && (
                              <span className="rounded-[4px] bg-[#2a1f3d] px-1.5 py-0.5 text-[11px] text-[#a893c0]">
                                {char.race}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1 lg:mt-2">
                            {/* 評価ピル */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#2a1f3d] py-0.5 pl-1.5 pr-2 lg:py-1 lg:pl-2 lg:pr-2.5">
                              <span className="lg:hidden">
                                <StarRatingDisplay rating={char.avgRating} size="sm" showValue />
                              </span>
                              <span className="hidden lg:inline-flex">
                                <StarRatingDisplay rating={char.avgRating} size="md" showValue />
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 注目コメント */}
                      {char.featuredComment && (
                        <div className="mx-2.5 mb-2.5 lg:mb-0 lg:flex-1 lg:min-w-0 lg:self-start lg:pt-2.5">
                          <p className="mb-1 flex items-center gap-1 px-0.5 text-[10px] font-bold text-[#38bdf8]">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                            </svg>
                            注目コメント
                          </p>
                          <div className="rounded-[10px] border border-[rgba(249,168,212,0.1)] bg-[rgba(42,33,62,0.8)] px-3 py-3 min-h-[72px] flex flex-col lg:min-h-[88px]">
                            <p className="line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-[#fafafa] lg:line-clamp-4">
                              {char.featuredComment}
                            </p>
                            <div className="mt-auto flex items-center justify-between pt-1">
                              {char.featuredCommentAuthor && (
                                <span className="text-[10px] text-[#8b7aab]">
                                  — {char.featuredCommentAuthor}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-thumbs-up">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                                </svg>
                                {char.featuredCommentThumbsUp}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 4位以降: グリッド表示 (4列) */}
            <div className="mt-4 grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {rankedCharacters.slice(3).map((char) => (
                <CharacterCard
                  key={char.id}
                  slug={char.slug}
                  name={char.name}
                  imageUrl={char.imageUrl}
                  avgRating={char.avgRating}
                  validVotesCount={char.validVotesCount}
                  rank={char.rank}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-4">
          <SectionFooterButton
            href="/ranking"
            label="キャラランキングをすべて見る"
            gradientFrom="#fb64b6"
            gradientTo="#ffa1ad"
          />
        </div>
      </section>

      {/* ====== 第2段: キャラクターを探す ====== */}
      <section className="space-y-4">
        <SectionHeading
          icon={
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="キャラクターを探す"
          subtitle="性格・タイプ・種族などで絞り込み"
          gradientFrom="#8b5cf6"
          gradientTo="#a78bfa"
        />

        <HomeSearchSection characters={searchCharacters} />
      </section>

      {/* ====== 第3段: 注目キャラクター ====== */}
      {trendingCharacters.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ backgroundImage: "linear-gradient(135deg, #fb64b6, #ff8904)" }}
                >
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </span>
                <h2 className="text-base font-bold text-[#fafafa]">
                  話題のキャラクター
                </h2>
              </div>
              <span className="text-xs text-[#8b7aab]">最近の注目</span>
            </div>
            <p className="text-xs text-[#a893c0]">今注目されているキャラクターをチェック！</p>
          </div>
          <div className="-mx-4 grid grid-cols-2 md:grid-cols-3 gap-2 px-2">
            {trendingCharacters.map((char) => {
              const elemStyle = char.element ? ELEMENT_COLORS[char.element] : null;
              return (
                <Link
                  key={char.id}
                  href={`/characters/${char.slug}`}
                  className="flex flex-col overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] transition-colors hover:bg-[rgba(36,27,53,0.7)] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 p-2.5">
                    {/* キャラアイコン */}
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                      {char.imageUrl ? (
                        <Image
                          src={char.imageUrl}
                          alt={char.name}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#2a1f3d] text-sm text-[#8b7aab]">
                          {char.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* 情報 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-[#fafafa]">
                          {char.name}
                        </p>
                        {char.element && ELEMENT_ICON_MAP[char.element] && (
                          <Image src={ELEMENT_ICON_MAP[char.element]} alt={char.element} width={16} height={16} className="shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {char.avgRating !== null && char.validVotesCount >= 1 ? (
                          <span className="text-sm font-bold text-[#fcd34d]">
                            ★{char.avgRating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#8b7aab]">
                            未評価
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 rounded bg-[rgba(246,51,154,0.8)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          +{char.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* コメントブロック */}
                  {char.latestComment && (
                    <div className="mx-2 mb-2 flex flex-col rounded-[10px] bg-[rgba(42,33,62,0.8)] border border-[rgba(249,168,212,0.05)] px-2.5 py-2 min-h-[76px]">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-[#fafafa]">
                        {char.latestComment}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        {char.latestCommentAuthor && (
                          <span className="text-[10px] text-[#8b7aab]">
                            — {char.latestCommentAuthor}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-thumbs-up">
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                          </svg>
                          {char.latestCommentThumbsUp}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ====== 第4段: 編成ランキング ====== */}
      <section className="space-y-4">
        <SectionHeading
          icon={<TeamIcon className="h-4 w-4 text-white" />}
          title="編成ランキング"
          subtitle="人気のパーティ編成をチェック・投稿しよう"
          href="/builds"
          linkLabel="もっと見る"
          gradientFrom="#fb64b6"
          gradientTo="#ff637e"
        />

        <HomeBuildsSection builds={buildsData} charMap={charMapPlain} />

        <SectionFooterButton
          href="/builds"
          label="編成ランキングをすべて見る"
          gradientFrom="#fb64b6"
          gradientTo="#ff637e"
        />
      </section>
    </div>
  );
}
