import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import type { Element } from "@/lib/constants";
import { HomeStatsSection } from "./home-stats-section";

interface RankedChar {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  role: string | null;
  imageUrl: string | null;
  avgRating: number;
  validVotesCount: number;
  boardCommentsCount: number;
  rank: number;
  featuredComment: string | null;
  featuredCommentAuthor: string | null;
  featuredCommentThumbsUp: number;
}

const ELEMENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  火: { border: "rgba(251,113,133,0.6)", bg: "rgba(251,113,133,0.15)", text: "#fb7185" },
  水: { border: "rgba(56,189,248,0.6)", bg: "rgba(56,189,248,0.15)", text: "#38bdf8" },
  風: { border: "rgba(74,222,128,0.6)", bg: "rgba(74,222,128,0.15)", text: "#34d399" },
  光: { border: "rgba(255,210,48,0.6)", bg: "rgba(255,210,48,0.15)", text: "#fcd34d" },
  闇: { border: "rgba(166,132,255,0.6)", bg: "rgba(166,132,255,0.15)", text: "#a78bfa" },
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
        <p className="mt-1 pl-[42px] text-xs text-text-muted">{subtitle}</p>
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
      className="flex w-full items-center justify-center gap-1 rounded-2xl py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
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

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
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
    .gte("valid_votes_count", 4)
    .order("rank", { ascending: true })
    .limit(15);

  const { data: characters } = await supabase
    .from("characters")
    .select("id, slug, name, element, role, image_url")
    .eq("is_hidden", false);

  const charMap = new Map<
    string,
    {
      slug: string;
      name: string;
      element: string | null;
      role: string | null;
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

  // --- 第2段: 話題のキャラクター（直近24時間） ---
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentComments } = await supabase
    .from("comments")
    .select("character_id, user_hash, body, display_name, thumbs_up_count")
    .eq("is_deleted", false)
    .gte("created_at", twentyFourHoursAgo);

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

  const rankedIds = new Set(rankedCharacters.map((c) => c.id));
  const trendingEntries = Array.from(trendingMap.entries())
    .filter(([id]) => !rankedIds.has(id))
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

  // --- 第3段: 編成ランキング（上位5件）---
  const { data: topBuilds } = await supabase
    .from("builds")
    .select(
      "id, mode, members, element_label, title, display_name, comment, likes_count, dislikes_count, updated_at, build_comments(count)"
    )
    .eq("is_deleted", false)
    .order("likes_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(5);

  // --- 第4段: ステータス別ランキングのデータ ---
  const { data: allChars } = await supabase
    .from("characters")
    .select("id, slug, name, element, role, image_url, stats")
    .eq("is_hidden", false);

  const { data: allRankings } = await supabase
    .from("character_rankings")
    .select("character_id, avg_rating, valid_votes_count");

  const rankingMapForStats = new Map<
    string,
    { avgRating: number; validVotesCount: number }
  >();
  if (allRankings) {
    for (const r of allRankings) {
      rankingMapForStats.set(r.character_id, {
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
      });
    }
  }

  const statsCharacters = (allChars ?? []).map((c) => {
    const rr = rankingMapForStats.get(c.id);
    const rawStats = (c.stats as Record<string, unknown>) ?? {};
    const stats: Record<string, number | null> = {};
    for (const key of ["hp", "patk", "matk", "def", "spd", "crit"]) {
      const val = rawStats[key];
      stats[key] = typeof val === "number" ? val : null;
    }
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      element: c.element,
      role: c.role,
      imageUrl: c.image_url,
      stats,
      avgRating: rr?.avgRating ?? null,
      validVotesCount: rr?.validVotesCount ?? 0,
    };
  });

  return (
    <div className="space-y-10">
      {/* ====== 第1段: 人気キャラランキング ====== */}
      <section className="space-y-4">
        <SectionHeading
          icon={<CrownIcon className="h-5 w-5 text-white" />}
          title="人気キャラランキング"
          subtitle="みんなの評価で算出 · 毎日 0:00 更新"
          href="/ranking"
          linkLabel="もっと見る"
          gradientFrom="#ffb900"
          gradientTo="#ff637e"
        />

        {/* 1位アナウンス */}
        {topChar && (
          <div className="pl-[42px] text-[11px] leading-relaxed">
            <span className="text-[#a893c0]">現在の1位は</span>
            <span className="font-bold text-[#faf5ff]">{topChar.name}</span>
            <span className="inline-flex items-center gap-0.5 align-middle">
              <svg className="h-2.5 w-2.5 text-[#fcd34d]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-[#fcd34d]">{topChar.avgRating.toFixed(1)}</span>
            </span>
            <span className="mx-1 text-[#6b5a80]">·</span>
            <span className="text-[#8b7aab]">みんなの評価で算出</span>
            <span className="mx-1 text-[#6b5a80]">·</span>
            <span className="inline-flex items-center gap-0.5 align-middle text-[#8b7aab]">
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              毎日 0:00 更新
            </span>
          </div>
        )}

        {rankedCharacters.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            まだランキングデータがありません
          </p>
        ) : (
          <>
            {/* ヒーロー表示 (1-3位) - Figma完全マッチ */}
            <div className="space-y-3">
              {rankedCharacters.slice(0, 3).map((char) => {
                const rank = char.rank as 1 | 2 | 3;
                const elemStyle = char.element ? ELEMENT_COLORS[char.element] : null;

                // 順位ごとのカラー設定
                const rankConfig = {
                  1: {
                    borderClass: "border-[rgba(249,168,212,0.1)] border-l-[3.5px] border-l-[#d4a017]",
                    bannerBg: "rgba(255,185,0,0.15)",
                    circleBg: "#ffb900",
                    circleText: "#1a1225",
                    rankText: "#fcd34d",
                    icon: (
                      <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
                      </svg>
                    ),
                  },
                  2: {
                    borderClass: "border-[rgba(249,168,212,0.1)] border-l-[2.4px] border-l-[#9ca3af]",
                    bannerBg: "rgba(144,161,185,0.1)",
                    circleBg: "#90a1b9",
                    circleText: "#1a1225",
                    rankText: "#d1d5db",
                    icon: null,
                  },
                  3: {
                    borderClass: "border-[rgba(249,168,212,0.1)] border-l-[2.4px] border-l-[#b45309]",
                    bannerBg: "rgba(225,113,0,0.1)",
                    circleBg: "#bb4d00",
                    circleText: "#fef3c7",
                    rankText: "#fe9a00",
                    icon: null,
                  },
                } as const;

                const cfg = rankConfig[rank];

                return (
                  <Link
                    key={char.id}
                    href={`/characters/${char.slug}`}
                    className={`block overflow-clip rounded-[16px] border bg-[rgba(36,27,53,0.95)] transition-colors hover:brightness-110 cursor-pointer ${cfg.borderClass}`}
                  >
                    {/* 順位バナー */}
                    <div
                      className="flex h-[38px] items-center gap-1.5 pl-3.5"
                      style={{ backgroundColor: cfg.bannerBg }}
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black"
                        style={{ backgroundColor: cfg.circleBg, color: cfg.circleText }}
                      >
                        {cfg.icon ?? rank}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: cfg.rankText }}
                      >
                        {rank}位
                      </span>
                    </div>

                    {/* キャラ情報 */}
                    <div className="flex gap-3 px-3.5 py-2.5">
                      {/* 80px キャラ画像 + 属性バッジ */}
                      <div className="relative h-20 w-20 shrink-0">
                        <div
                          className="h-20 w-20 overflow-hidden rounded-[14px] p-[1px]"
                          style={{
                            border: `1.2px solid ${elemStyle?.border ?? "rgba(249,168,212,0.2)"}`,
                            boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)",
                          }}
                        >
                          {char.imageUrl ? (
                            <Image
                              src={char.imageUrl}
                              alt={char.name}
                              width={80}
                              height={80}
                              className="h-full w-full rounded-[12px] object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-[12px] bg-[#2a1f3d] text-lg text-[#8b7aab]">
                              {char.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        {char.element && elemStyle && (
                          <div
                            className="absolute -top-1 right-0 flex items-center justify-center rounded-[8px] px-1.5 py-0.5"
                            style={{
                              backgroundColor: elemStyle.bg,
                              border: `1.2px solid ${elemStyle.border}`,
                              boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                            }}
                          >
                            <span className="text-[8px] font-bold" style={{ color: elemStyle.text }}>
                              {char.element}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 名前・ロール・評価 */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#faf5ff]">
                          {char.name}
                        </p>
                        {char.role && (
                          <p className="text-[11px] text-[#8b7aab]">{char.role}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {/* 評価ピル */}
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#2a1f3d] py-0.5 pl-1.5 pr-2">
                            <StarRatingDisplay rating={char.avgRating} size="sm" showValue />
                          </span>
                          <span className="text-[11px] text-[#8b7aab]">
                            {char.validVotesCount}票
                          </span>
                          {char.boardCommentsCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-[#8b7aab]">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {char.boardCommentsCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 注目コメント */}
                    {char.featuredComment && (
                      <div className="mx-2.5 mb-2.5 rounded-[10px] border border-[rgba(249,168,212,0.1)] bg-[rgba(30,21,48,0.8)] px-3 pb-1 pt-2.5">
                        <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold text-[#38bdf8]">
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                          </svg>
                          注目コメント
                        </p>
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-[rgba(252,231,243,0.8)]">
                          {char.featuredComment}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          {char.featuredCommentAuthor && (
                            <span className="text-[10px] text-[#8b7aab]">
                              — {char.featuredCommentAuthor}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#f9a8d4]">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                            </svg>
                            {char.featuredCommentThumbsUp}
                          </span>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* 4位以降: グリッド表示 (Figma完全マッチ - 4列) */}
            <div className="grid grid-cols-4 gap-2">
              {rankedCharacters.slice(3).map((char) => {
                const elemStyle = char.element ? ELEMENT_COLORS[char.element] : null;
                return (
                  <Link
                    key={char.id}
                    href={`/characters/${char.slug}`}
                    className="flex flex-col overflow-clip rounded-[14px] bg-[#241b35] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer"
                    style={{ border: "1.2px solid rgba(249,168,212,0.1)" }}
                  >
                    {/* 画像エリア */}
                    <div className="relative">
                        {char.imageUrl ? (
                          <Image
                            src={char.imageUrl}
                            alt={char.name}
                            width={82}
                            height={82}
                            className="aspect-square w-full rounded-t-[12px] object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center rounded-t-[12px] bg-[#2a1f3d] text-sm text-[#8b7aab]">
                            {char.name.charAt(0)}
                          </div>
                        )}
                      {/* 順位バッジ (左上) */}
                      <div
                        className="absolute left-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full shadow-[0px_10px_15px_rgba(0,0,0,0.1)]"
                        style={{
                          backgroundColor: "rgba(42,31,61,0.9)",
                          border: "1.2px solid rgba(249,168,212,0.1)",
                        }}
                      >
                        <span className="text-[8px] font-bold text-[#a893c0]">{char.rank}</span>
                      </div>
                      {/* 属性バッジ (右上) */}
                      {char.element && elemStyle && (
                        <div
                          className="absolute right-0.5 top-0.5 flex items-center justify-center rounded-[10px] px-1 py-0"
                          style={{
                            backgroundColor: elemStyle.bg,
                            border: `1.2px solid ${elemStyle.border}`,
                            boxShadow: "0px 10px 15px rgba(0,0,0,0.1)",
                          }}
                        >
                          <span className="text-[8px] font-bold leading-3" style={{ color: elemStyle.text }}>
                            {char.element}
                          </span>
                        </div>
                      )}
                      {/* ⭐4.8 オーバーレイ (左下) */}
                      {char.avgRating != null && (
                        <div
                          className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5 rounded-[10px] py-[1px] pl-[5px] pr-[1px] shadow-[0px_10px_15px_rgba(0,0,0,0.1)]"
                          style={{
                            backgroundColor: "rgba(26,18,37,0.9)",
                            border: "1.2px solid rgba(249,168,212,0.1)",
                          }}
                        >
                          <svg className="h-2.5 w-2.5 text-[#fcd34d]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[10px] font-bold text-[#fcd34d]">
                            {char.avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* 名前 */}
                    <div className="bg-[rgba(36,27,53,0.95)] px-1 pt-0.5 pb-1.5">
                      <p className="truncate text-center text-[9px] font-bold leading-tight text-[#fce7f3]">
                        {char.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        <SectionFooterButton
          href="/ranking"
          label="キャラランキングをすべて見る"
          gradientFrom="#fb64b6"
          gradientTo="#ffa1ad"
        />
      </section>

      {/* ====== 第2段: 話題のキャラクター ====== */}
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
                <h2 className="text-base font-bold text-[#faf5ff]">
                  話題のキャラクター
                </h2>
              </div>
              <span className="text-xs text-[#8b7aab]">直近24時間</span>
            </div>
            <p className="text-xs text-[#a893c0]">今注目されているキャラクターをチェック！</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trendingCharacters.map((char) => {
              const elemStyle = char.element ? ELEMENT_COLORS[char.element] : null;
              return (
                <Link
                  key={char.id}
                  href={`/characters/${char.slug}`}
                  className="flex flex-col overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] transition-colors hover:bg-[rgba(36,27,53,0.7)] cursor-pointer"
                >
                  <div className="flex items-center gap-2 p-2">
                    {/* キャラアイコン */}
                    <div className="relative h-11 w-11 shrink-0">
                      <div
                        className="h-11 w-11 overflow-hidden rounded-[10px] p-[2px]"
                        style={{
                          border: elemStyle ? `1.2px solid ${elemStyle.border}` : "1.2px solid rgba(249,168,212,0.2)",
                          backgroundColor: elemStyle?.bg ?? "transparent",
                        }}
                      >
                        {char.imageUrl ? (
                          <Image
                            src={char.imageUrl}
                            alt={char.name}
                            width={44}
                            height={44}
                            className="h-full w-full rounded-[8px] object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-[8px] bg-[#2a1f3d] text-xs text-[#8b7aab]">
                            {char.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {char.element && elemStyle && (
                        <div
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-[4px]"
                          style={{
                            backgroundColor: elemStyle.bg,
                            border: `1.2px solid ${elemStyle.border}`,
                            boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          <span className="text-[7px] font-bold" style={{ color: elemStyle.text }}>
                            {char.element}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* 情報 */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold text-[#fce7f3]">
                        {char.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1">
                        {char.avgRating !== null && char.validVotesCount >= 4 ? (
                          <>
                            <svg className="h-2.5 w-2.5 text-[#fcd34d]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[10px] font-bold text-[#fcd34d]">
                              {char.avgRating.toFixed(1)}
                            </span>
                            <span className="text-[8px] text-[#8b7aab]">
                              {char.validVotesCount}票
                            </span>
                          </>
                        ) : (
                          <span className="text-[8px] text-[#8b7aab]">
                            {char.validVotesCount > 0 ? `${char.validVotesCount}票` : "未評価"}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-0.5 rounded bg-[rgba(246,51,154,0.8)] px-1 py-0.5 text-[7px] font-bold text-white">
                          <svg className="h-1.5 w-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          +{char.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* コメントブロック */}
                  {char.latestComment && (
                    <div className="mx-1.5 mb-1.5 rounded-[10px] bg-[rgba(30,21,48,0.8)] border border-[rgba(249,168,212,0.05)] px-2.5 py-2">
                      <p className="line-clamp-2 text-[9px] leading-relaxed text-[rgba(252,231,243,0.8)]">
                        {char.latestComment}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        {char.latestCommentAuthor && (
                          <span className="text-[8px] text-[#8b7aab]">
                            — {char.latestCommentAuthor}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-[#f9a8d4]">
                          <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* ====== 第3段: 編成ランキング ====== */}
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

        {!topBuilds || topBuilds.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8b7aab]">
            まだ編成が投稿されていません
          </p>
        ) : (
          <div className="space-y-2">
            {topBuilds.map((build, buildIndex) => {
              const memberIds = build.members as string[];
              const memberElements = memberIds
                .map((mId) => charMap.get(mId)?.element)
                .filter((e): e is string => e !== null && e !== undefined);
              const uniqueElements = [...new Set(memberElements)];
              const commentCount = Array.isArray(build.build_comments) && build.build_comments.length > 0
                ? (build.build_comments[0] as { count: number }).count
                : 0;

              // 3列×2行のメンバー配置を作成
              const row1 = memberIds.slice(0, 3); // 上段
              const row2 = memberIds.slice(3, 6); // 下段

              return (
                <Link
                  key={build.id}
                  href={`/builds/${build.id}`}
                  className="block overflow-clip rounded-[16px] bg-gradient-to-b from-[rgba(36,27,53,0.8)] to-[rgba(36,27,53,0.4)] transition-colors hover:from-[rgba(36,27,53,0.9)] hover:to-[rgba(36,27,53,0.6)] cursor-pointer"
                  style={{ border: "1.2px solid rgba(249,168,212,0.1)" }}
                >
                  <div className="p-3 space-y-2">
                    {/* タイトル行 + 右上コメント数 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[14px] text-xs font-bold shadow-[0px_10px_15px_rgba(0,0,0,0.1)]"
                          style={{
                            backgroundImage: buildIndex === 0
                              ? "linear-gradient(135deg, #ffd230, #fe9a00)"
                              : buildIndex === 1
                              ? "linear-gradient(135deg, #c0c0c0, #90a1b9)"
                              : "linear-gradient(135deg, #b45309, #bb4d00)",
                            color: buildIndex === 0 ? "#461901" : buildIndex === 1 ? "#1a1225" : "#fef3c7",
                          }}
                        >
                          {buildIndex + 1}
                        </span>
                        {build.title && (
                          <span className="truncate text-[11px] font-bold text-[#fce7f3]">
                            {build.title}
                          </span>
                        )}
                      </div>
                      {/* コメント数 (右上) */}
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-[#8b7aab]">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {commentCount}
                      </span>
                    </div>

                    {/* 属性バッジ + モード */}
                    <div className="flex items-center gap-1 pl-[34px]">
                      {uniqueElements.map((elem) => {
                        const es = ELEMENT_COLORS[elem];
                        return es ? (
                          <span
                            key={elem}
                            className="rounded-[4px] px-1 py-0.5 text-[8px] font-bold opacity-80"
                            style={{ backgroundColor: es.bg, color: es.text }}
                          >
                            {elem}
                          </span>
                        ) : null;
                      })}
                      {build.mode && (
                        <span className="rounded-[4px] bg-[rgba(36,27,53,0.5)] px-1.5 py-0.5 text-[8px] font-bold text-[#8b7aab]">
                          {build.mode === "pve" ? "PvE" : "PvP"}
                        </span>
                      )}
                    </div>

                    {/* メンバーテーブル (後衛/中衛/前衛 × 2行) */}
                    <div className="overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.05)]">
                      {/* ヘッダー行 */}
                      <div className="grid grid-cols-3 bg-[rgba(30,21,48,0.8)]">
                        <span className="border-r border-[rgba(249,168,212,0.05)] py-1 text-center text-[9px] font-bold text-[#a893c0]">後衛</span>
                        <span className="border-r border-[rgba(249,168,212,0.05)] py-1 text-center text-[9px] font-bold text-[#a893c0]">中衛</span>
                        <span className="py-1 text-center text-[9px] font-bold text-[#a893c0]">前衛</span>
                      </div>
                      {/* 上段 */}
                      <div className="grid grid-cols-3 border-b border-[rgba(249,168,212,0.05)]">
                        {row1.map((mId, i) => {
                          const char = charMap.get(mId);
                          const elemStyle = char?.element ? ELEMENT_COLORS[char.element] : null;
                          return (
                            <div key={`${mId}-${i}`} className={`flex flex-col items-center gap-0.5 py-2 ${i < 2 ? "border-r border-[rgba(249,168,212,0.05)]" : ""}`}>
                              <div className="relative">
                                <div
                                  className="h-9 w-9 overflow-hidden rounded-[10px] p-[2px]"
                                  style={{
                                    border: elemStyle ? `1.2px solid ${elemStyle.border}` : "1.2px solid rgba(249,168,212,0.1)",
                                    backgroundColor: elemStyle?.bg ?? "transparent",
                                  }}
                                >
                                  {char?.imageUrl ? (
                                    <Image src={char.imageUrl} alt={char?.name ?? "?"} width={36} height={36} className="h-full w-full rounded-[4px] object-cover" loading="lazy" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center rounded-[4px] bg-[#2a1f3d] text-[10px] text-[#8b7aab]">{char?.name?.charAt(0) ?? "?"}</div>
                                  )}
                                </div>
                                {char?.element && elemStyle && (
                                  <div className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ backgroundColor: elemStyle.bg, border: `1.2px solid ${elemStyle.border}` }}>
                                    <span className="text-[7px] font-bold" style={{ color: elemStyle.text }}>{char.element}</span>
                                  </div>
                                )}
                              </div>
                              <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">{char?.name ?? "?"}</span>
                            </div>
                          );
                        })}
                      </div>
                      {/* 下段 */}
                      {row2.length > 0 && (
                        <div className="grid grid-cols-3">
                          {row2.map((mId, i) => {
                            const char = charMap.get(mId);
                            const elemStyle = char?.element ? ELEMENT_COLORS[char.element] : null;
                            return (
                              <div key={`${mId}-${i + 3}`} className={`flex flex-col items-center gap-0.5 py-2 ${i < 2 ? "border-r border-[rgba(249,168,212,0.05)]" : ""}`}>
                                <div className="relative">
                                  <div
                                    className="h-9 w-9 overflow-hidden rounded-[10px] p-[2px]"
                                    style={{
                                      border: elemStyle ? `1.2px solid ${elemStyle.border}` : "1.2px solid rgba(249,168,212,0.1)",
                                      backgroundColor: elemStyle?.bg ?? "transparent",
                                    }}
                                  >
                                    {char?.imageUrl ? (
                                      <Image src={char.imageUrl} alt={char?.name ?? "?"} width={36} height={36} className="h-full w-full rounded-[4px] object-cover" loading="lazy" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center rounded-[4px] bg-[#2a1f3d] text-[10px] text-[#8b7aab]">{char?.name?.charAt(0) ?? "?"}</div>
                                    )}
                                  </div>
                                  {char?.element && elemStyle && (
                                    <div className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ backgroundColor: elemStyle.bg, border: `1.2px solid ${elemStyle.border}` }}>
                                      <span className="text-[7px] font-bold" style={{ color: elemStyle.text }}>{char.element}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="max-w-16 truncate text-center text-[8px] font-bold text-[#a893c0]">{char?.name ?? "?"}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* コメント */}
                    {build.comment && (
                      <div className="rounded-[14px] border border-[rgba(249,168,212,0.05)] bg-[rgba(30,21,48,0.8)] px-3 py-2.5">
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-[rgba(252,231,243,0.8)]">
                          {build.comment}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between border-t border-[rgba(249,168,212,0.05)] pt-1.5">
                          {build.display_name && (
                            <span className="text-[10px] text-[#8b7aab]">{build.display_name}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f9a8d4]">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                              </svg>
                              {build.likes_count}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7dd3fc]">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                              </svg>
                              {build.dislikes_count}
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
        )}

        <SectionFooterButton
          href="/builds"
          label="編成ランキングをすべて見る"
          gradientFrom="#fb64b6"
          gradientTo="#ff637e"
        />
      </section>

      {/* ====== 第4段: ステータス別ランキング ====== */}
      <section className="space-y-4">
        <SectionHeading
          icon={<ChartIcon className="h-4 w-4 text-white" />}
          title="ステータス別ランキング"
          subtitle="キャラを検索・フィルタして性能を比較"
          href="/stats"
          linkLabel="もっと見る"
          gradientFrom="#8b5cf6"
          gradientTo="#a78bfa"
        />

        <HomeStatsSection characters={statsCharacters} />

        <SectionFooterButton
          href="/stats"
          label="ステータス別ランキングをすべて見る"
          gradientFrom="#8b5cf6"
          gradientTo="#a78bfa"
        />
      </section>
    </div>
  );
}
