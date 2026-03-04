import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { CharacterCard } from "@/components/character/character-card";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
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
}

interface TrendingChar {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  commentCount: number;
  latestComment: string | null;
  latestCommentAuthor: string | null;
}

/* ===== セクション見出し共通 ===== */
function SectionHeading({
  gradientFrom,
  gradientTo,
  icon,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-1 rounded-full"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
            }}
          />
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          </div>
        </div>
        {href && linkLabel && (
          <Link
            href={href}
            className="text-sm text-text-tertiary transition-colors hover:text-accent"
          >
            {linkLabel} →
          </Link>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 pl-7 text-sm text-text-tertiary">{subtitle}</p>
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
      className="block w-full rounded-2xl py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
      style={{
        backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
      }}
    >
      {label}
    </Link>
  );
}

/* ===== アイコン ===== */
function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
        clipRule="evenodd"
      />
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
          .select("character_id, body, display_name")
          .in("character_id", rankedCharIds)
          .eq("comment_type", "vote")
          .eq("is_latest_vote", true)
          .eq("is_deleted", false)
          .gte("rating", 3.0)
          .order("created_at", { ascending: false })
      : { data: [] };

  const featuredMap = new Map<string, { body: string; author: string }>();
  if (featuredComments) {
    for (const fc of featuredComments) {
      if (!featuredMap.has(fc.character_id) && fc.body) {
        featuredMap.set(fc.character_id, {
          body: fc.body,
          author: fc.display_name || "名無し",
        });
      }
    }
  }

  // フォールバック
  const missingIds = rankedCharIds.filter((id) => !featuredMap.has(id));
  if (missingIds.length > 0) {
    const { data: fallbackComments } = await supabase
      .from("comments")
      .select("character_id, body, display_name")
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
    .select("character_id, user_hash, body, display_name")
    .eq("is_deleted", false)
    .gte("created_at", twentyFourHoursAgo);

  const trendingMap = new Map<string, number>();
  const userCharCountMap = new Map<string, number>();
  const trendingCommentMap = new Map<
    string,
    { body: string; author: string }
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
        });
      }
    }
  }

  const rankedIds = new Set(rankedCharacters.map((c) => c.id));
  const trendingEntries = Array.from(trendingMap.entries())
    .filter(([id]) => !rankedIds.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const trendingCharacters: TrendingChar[] = trendingEntries
    .map(([id, count]) => {
      const char = charMap.get(id);
      if (!char) return null;
      const comment = trendingCommentMap.get(id);
      return {
        id,
        slug: char.slug,
        name: char.name,
        element: char.element as Element | null,
        imageUrl: char.imageUrl,
        commentCount: count,
        latestComment: comment?.body ?? null,
        latestCommentAuthor: comment?.author ?? null,
      };
    })
    .filter((c): c is TrendingChar => c !== null);

  // --- 第3段: 編成ランキング（上位5件）---
  const { data: topBuilds } = await supabase
    .from("builds")
    .select(
      "id, mode, members, element_label, title, display_name, comment, likes_count, dislikes_count, updated_at"
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
          gradientFrom="#fb64b6"
          gradientTo="#ffa1ad"
          icon={<StarIcon className="h-5 w-5 text-[#fb64b6]" />}
          title="人気キャラランキング"
          subtitle="みんなの評価で算出 ・ 毎日 0:00 更新"
          href="/ranking"
          linkLabel="もっと見る"
        />

        {/* 1位アナウンス */}
        {topChar && (
          <div className="rounded-2xl border border-border-primary bg-bg-card/30 px-4 py-3">
            <p className="text-sm text-text-secondary">
              現在の1位は{" "}
              <Link
                href={`/characters/${topChar.slug}`}
                className="font-bold text-accent"
              >
                {topChar.name}
              </Link>
            </p>
          </div>
        )}

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
            <div className="space-y-2">
              {rankedCharacters.slice(3).map((char) => (
                <Link
                  key={char.id}
                  href={`/characters/${char.slug}`}
                  className="flex items-start gap-3 rounded-2xl border border-border-primary bg-bg-card px-3 py-3 transition-colors hover:bg-bg-card-hover"
                >
                  <span className="mt-1 w-6 shrink-0 text-center text-sm font-bold text-text-muted">
                    {char.rank}
                  </span>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border-primary">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-text-primary">
                        {char.name}
                      </span>
                      {char.role && (
                        <span className="shrink-0 text-xs text-text-muted">
                          {char.role}
                        </span>
                      )}
                    </div>
                    {char.featuredComment && (
                      <div className="mt-1">
                        <p className="text-xs text-text-muted">注目コメント</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">
                          {char.featuredComment}
                        </p>
                        {char.featuredCommentAuthor && (
                          <p className="mt-0.5 text-[10px] text-text-muted">
                            {char.featuredCommentAuthor}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <StarRatingDisplay
                      rating={char.avgRating}
                      size="sm"
                      showValue
                    />
                    <span className="block text-[10px] text-text-muted">
                      {char.validVotesCount}票
                    </span>
                  </div>
                </Link>
              ))}
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
      <section className="space-y-4">
        <SectionHeading
          gradientFrom="#fb64b6"
          gradientTo="#ffa1ad"
          icon={<FireIcon className="h-5 w-5 text-[#fb64b6]" />}
          title="話題のキャラクター"
          subtitle="今注目されているキャラクターをチェック！"
        />
        <p className="pl-7 text-xs text-text-muted">直近24時間</p>

        {trendingCharacters.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-tertiary">
            直近24時間でコメントされたキャラクターはまだありません
          </p>
        ) : (
          <div className="space-y-2">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex items-start gap-3 rounded-2xl border border-border-primary bg-bg-card/30 p-3 transition-colors hover:bg-bg-card-hover"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-primary">
                  {char.imageUrl ? (
                    <Image
                      src={char.imageUrl}
                      alt={char.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-bg-tertiary text-xs text-text-tertiary">
                      {char.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-text-primary">
                      {char.name}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {char.commentCount}件
                    </Badge>
                  </div>
                  {char.latestComment && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                      {char.latestComment}
                    </p>
                  )}
                  {char.latestCommentAuthor && (
                    <p className="mt-0.5 text-[10px] text-text-muted">
                      {char.latestCommentAuthor}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ====== 第3段: 編成ランキング ====== */}
      <section className="space-y-4">
        <SectionHeading
          gradientFrom="#3b82f6"
          gradientTo="#60a5fa"
          icon={<TeamIcon className="h-5 w-5 text-[#3b82f6]" />}
          title="編成ランキング"
          subtitle="人気のパーティ編成をチェックしてクエスト攻略に活用しよう"
          href="/builds"
          linkLabel="もっと見る"
        />

        {!topBuilds || topBuilds.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">
            まだ編成が投稿されていません
          </p>
        ) : (
          <div className="space-y-2">
            {topBuilds.map((build) => {
              const memberIds = build.members as string[];

              return (
                <Link
                  key={build.id}
                  href={`/builds/${build.id}`}
                  className="block rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover"
                >
                  {/* タイトル */}
                  {build.title && (
                    <p className="mb-2 text-sm font-bold text-text-primary">
                      {build.title}
                    </p>
                  )}

                  {/* メンバーアイコン + 名前 */}
                  <div className="flex gap-2 overflow-x-auto">
                    {memberIds.map((mId, i) => {
                      const char = charMap.get(mId);
                      return (
                        <div key={`${mId}-${i}`} className="flex flex-col items-center gap-1">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border-primary">
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
                          <span className="max-w-[60px] truncate text-[10px] text-text-muted">
                            {char?.name ?? "?"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* コメント抜粋 */}
                  {build.comment && (
                    <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
                      {build.comment}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                    {build.display_name && (
                      <span>{build.display_name}</span>
                    )}
                    <span>👍 {build.likes_count}</span>
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

        <SectionFooterButton
          href="/builds"
          label="編成ランキングをすべて見る"
          gradientFrom="#3b82f6"
          gradientTo="#60a5fa"
        />
      </section>

      {/* ====== 第4段: ステータス別ランキング ====== */}
      <section className="space-y-4">
        <SectionHeading
          gradientFrom="#8b5cf6"
          gradientTo="#a78bfa"
          icon={<ChartIcon className="h-5 w-5 text-[#8b5cf6]" />}
          title="ステータス別ランキング"
          subtitle="キャラを検索・フィルタして性能を比較"
          href="/stats"
          linkLabel="もっと見る"
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
