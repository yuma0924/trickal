import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { CharacterCard } from "@/components/character/character-card";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Element } from "@/lib/constants";
import { HomeStatsSection } from "./home-stats-section";

interface RankedChar {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  avgRating: number;
  validVotesCount: number;
  boardCommentsCount: number;
  rank: number;
  featuredComment: string | null;
}

interface TrendingChar {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  commentCount: number;
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
    .select("id, slug, name, element, image_url")
    .eq("is_hidden", false);

  const charMap = new Map<
    string,
    { slug: string; name: string; element: string | null; imageUrl: string | null }
  >();
  if (characters) {
    for (const c of characters) {
      charMap.set(c.id, {
        slug: c.slug,
        name: c.name,
        element: c.element,
        imageUrl: c.image_url,
      });
    }
  }

  // 注目コメント取得（各キャラの上位1件）
  const rankedCharIds = (rankings ?? []).map((r) => r.character_id);

  // 注目コメント: 3.0以上 & is_latest_vote=true の最新1件
  const { data: featuredComments } = rankedCharIds.length > 0
    ? await supabase
        .from("comments")
        .select("character_id, body")
        .in("character_id", rankedCharIds)
        .eq("comment_type", "vote")
        .eq("is_latest_vote", true)
        .eq("is_deleted", false)
        .gte("rating", 3.0)
        .order("created_at", { ascending: false })
    : { data: [] };

  // キャラごとに注目コメント1件ずつ取得
  const featuredMap = new Map<string, string>();
  if (featuredComments) {
    for (const fc of featuredComments) {
      if (!featuredMap.has(fc.character_id) && fc.body) {
        featuredMap.set(fc.character_id, fc.body);
      }
    }
  }

  // フォールバック: 注目コメントがないキャラには👍最多のコメント
  const missingIds = rankedCharIds.filter((id) => !featuredMap.has(id));
  if (missingIds.length > 0) {
    const { data: fallbackComments } = await supabase
      .from("comments")
      .select("character_id, body")
      .in("character_id", missingIds)
      .eq("is_deleted", false)
      .order("thumbs_up_count", { ascending: false })
      .order("created_at", { ascending: false });

    if (fallbackComments) {
      for (const fc of fallbackComments) {
        if (!featuredMap.has(fc.character_id) && fc.body) {
          featuredMap.set(fc.character_id, fc.body);
        }
      }
    }
  }

  const rankedCharacters: RankedChar[] = (rankings ?? [])
    .map((r) => {
      const char = charMap.get(r.character_id);
      if (!char || r.rank === null) return null;
      return {
        id: r.character_id,
        slug: char.slug,
        name: char.name,
        element: char.element as Element | null,
        imageUrl: char.imageUrl,
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
        boardCommentsCount: r.board_comments_count,
        rank: r.rank,
        featuredComment: featuredMap.get(r.character_id) ?? null,
      };
    })
    .filter((c): c is RankedChar => c !== null);

  // --- 第2段: 話題のキャラクター（直近24時間） ---
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentComments } = await supabase
    .from("comments")
    .select("character_id, user_hash")
    .eq("is_deleted", false)
    .gte("created_at", twentyFourHoursAgo);

  // 連投ガード: 1キャラにつき同一 user_hash は最大3件まで
  const trendingMap = new Map<string, number>();
  const userCharCountMap = new Map<string, number>();

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
    }
  }

  // 第1段に含まれるキャラを除外
  const rankedIds = new Set(rankedCharacters.map((c) => c.id));
  const trendingEntries = Array.from(trendingMap.entries())
    .filter(([id]) => !rankedIds.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const trendingCharacters: TrendingChar[] = trendingEntries
    .map(([id, count]) => {
      const char = charMap.get(id);
      if (!char) return null;
      return {
        id,
        slug: char.slug,
        name: char.name,
        element: char.element as Element | null,
        imageUrl: char.imageUrl,
        commentCount: count,
      };
    })
    .filter((c): c is TrendingChar => c !== null);

  // --- 第3段: 編成ランキング（上位5件）---
  const { data: topBuilds } = await supabase
    .from("builds")
    .select("id, mode, members, element_label, title, display_name, comment, likes_count, dislikes_count, updated_at")
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

  const rankingMapForStats = new Map<string, { avgRating: number; validVotesCount: number }>();
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
      {/* 第1段: 人気キャラランキング */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            人気キャラランキング
          </h2>
          <Link
            href="/ranking"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            もっと見る →
          </Link>
        </div>

        {rankedCharacters.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            まだランキングデータがありません
          </p>
        ) : (
          <>
            {/* ヒーロー表示 (1-3位) */}
            <div className="grid grid-cols-3 gap-2">
              {rankedCharacters.slice(0, 3).map((char) => (
                <CharacterCard
                  key={char.id}
                  slug={char.slug}
                  name={char.name}
                  imageUrl={char.imageUrl}
                  element={char.element ?? undefined}
                  avgRating={char.avgRating}
                  validVotesCount={char.validVotesCount}
                  rank={char.rank}
                  isHero
                />
              ))}
            </div>

            {/* 4位以降: リスト表示 */}
            <div className="space-y-1">
              {rankedCharacters.slice(3).map((char) => (
                <Link
                  key={char.id}
                  href={`/characters/${char.slug}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bg-card-hover cursor-pointer"
                >
                  <span className="w-6 text-center text-sm font-bold text-text-tertiary">
                    {char.rank}
                  </span>
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border-primary">
                    {char.imageUrl ? (
                      <Image
                        src={char.imageUrl}
                        alt={char.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-tertiary">
                        {char.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {char.name}
                    </span>
                    {char.featuredComment && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-text-tertiary">
                        {char.featuredComment}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <StarRatingDisplay
                      rating={char.avgRating}
                      size="sm"
                      showValue
                    />
                    <span className="block text-[10px] text-text-tertiary">
                      {char.validVotesCount}票
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 第2段: 話題のキャラクター */}
      {trendingCharacters.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">
            話題のキャラクター
          </h2>
          <p className="text-xs text-text-tertiary">直近24時間のコメント数</p>
          <div className="grid grid-cols-3 gap-2">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:bg-bg-card-hover cursor-pointer"
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg border border-border-primary">
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
                    <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-tertiary">
                      {char.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-text-primary line-clamp-1">
                  {char.name}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {char.commentCount}件
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 第3段: 編成ランキング */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            編成ランキング
          </h2>
          <Link
            href="/builds"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            すべて見る →
          </Link>
        </div>

        {!topBuilds || topBuilds.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            まだ編成が投稿されていません
          </p>
        ) : (
          <div className="space-y-2">
            {topBuilds.map((build) => {
              const memberIds = build.members as string[];
              const netScore = build.likes_count - build.dislikes_count;

              return (
                <Link
                  key={build.id}
                  href={`/builds/${build.id}`}
                  className="block rounded-lg bg-bg-card p-3 transition-colors hover:bg-bg-card-hover cursor-pointer"
                >
                  {/* メンバーアイコン */}
                  <div className="flex gap-1 overflow-x-auto">
                    {memberIds.map((mId, i) => {
                      const char = charMap.get(mId);
                      return (
                        <div
                          key={`${mId}-${i}`}
                          className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-border-primary"
                        >
                          {char?.imageUrl ? (
                            <Image
                              src={char.imageUrl}
                              alt={char?.name ?? "?"}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-tertiary">
                              {char?.name?.charAt(0) ?? "?"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* コメント抜粋 */}
                  <p className="mt-2 line-clamp-3 text-sm text-text-secondary">
                    {build.comment}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                    <span>👍 {build.likes_count}</span>
                    <span>
                      {new Date(build.updated_at).toLocaleDateString("ja-JP")}
                    </span>
                    {build.element_label && (
                      <Badge variant="outline" className="text-[10px]">
                        {build.element_label}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 第4段: ステータス別ランキング */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            ステータス別ランキング
          </h2>
          <Link
            href="/stats"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            すべて見る →
          </Link>
        </div>

        <HomeStatsSection characters={statsCharacters} />
      </section>
    </div>
  );
}
