import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { BuildsClient } from "./builds-client";

const ELEMENT_ICON_MAP: Record<string, string> = {
  純粋: "/icons/pure.png",
  冷静: "/icons/calm.png",
  狂気: "/icons/madness.png",
  活発: "/icons/lively.png",
  憂鬱: "/icons/melancholy.png",
};

export const metadata: Metadata = {
  title: "編成ランキング | みんなで決めるトリッカルランキング",
  description:
    "トリッカルのおすすめ編成ランキング。コンテンツ別の人気編成をチェック",
};

export default async function BuildsPage() {
  const supabase = await createServerClient();

  // --- 話題のキャラクター（直近24時間）---
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
  const trendingCommentMap = new Map<string, { body: string; author: string; thumbsUp: number }>();

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

  // ランキング情報取得（話題キャラの評価表示用）
  const { data: rankings } = await supabase
    .from("character_rankings")
    .select("character_id, avg_rating, valid_votes_count");

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

  const trendingEntries = Array.from(trendingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // ランキングマップ
  const rankingLookup = new Map<string, { avgRating: number; validVotesCount: number }>();
  if (rankings) {
    for (const r of rankings) {
      rankingLookup.set(r.character_id, {
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
      });
    }
  }

  interface TrendingChar {
    id: string;
    slug: string;
    name: string;
    element: string | null;
    imageUrl: string | null;
    commentCount: number;
    avgRating: number | null;
    validVotesCount: number;
    latestComment: string | null;
    latestCommentAuthor: string | null;
    latestCommentThumbsUp: number;
  }

  const trendingCharacters: TrendingChar[] = trendingEntries
    .map(([id, count]) => {
      const char = charMap.get(id);
      if (!char) return null;
      const rr = rankingLookup.get(id);
      return {
        id,
        slug: char.slug,
        name: char.name,
        element: char.element,
        imageUrl: char.imageUrl,
        commentCount: count,
        avgRating: rr?.avgRating ?? null,
        validVotesCount: rr?.validVotesCount ?? 0,
        latestComment: trendingCommentMap.get(id)?.body ?? null,
        latestCommentAuthor: trendingCommentMap.get(id)?.author ?? null,
        latestCommentThumbsUp: trendingCommentMap.get(id)?.thumbsUp ?? 0,
      };
    })
    .filter((c): c is TrendingChar => c !== null);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
            style={{ backgroundImage: "linear-gradient(135deg, #fb64b6, #ff637e)" }}
          >
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </span>
          <h1 className="text-lg font-bold text-text-primary">編成ランキング</h1>
        </div>
        <p className="mt-1 pl-[42px] text-xs text-text-muted">
          人気のパーティ編成をチェック・投稿しよう
        </p>
      </div>

      <BuildsClient />

      {/* 話題のキャラクター（直近24時間） */}
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
              <span className="text-xs text-[#8b7aab]">最近の注目</span>
            </div>
            <p className="text-xs text-[#a893c0]">今注目されているキャラクターをチェック！</p>
          </div>
          <div className="-mx-4 grid grid-cols-2 gap-2 px-2">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex flex-col overflow-hidden rounded-[14px] border border-[rgba(249,168,212,0.1)] bg-[rgba(36,27,53,0.5)] transition-colors hover:bg-[rgba(36,27,53,0.7)] cursor-pointer"
              >
                {/* キャラ情報 */}
                <div className="flex items-center gap-2.5 p-2.5">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm font-bold text-[#fce7f3]">
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
                {/* コメント */}
                {char.latestComment && (
                  <div className="mx-2 mb-2 rounded-[10px] bg-[rgba(30,21,48,0.8)] border border-[rgba(249,168,212,0.05)] px-2.5 py-2">
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-[rgba(252,231,243,0.8)]">
                      {char.latestComment}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
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
            ))}
          </div>
        </section>
      )}

      {/* 他のランキングもチェック */}
      <section className="space-y-3">
        <p className="text-sm font-bold text-text-primary">他のランキングもチェック</p>
        <Link
          href="/ranking"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover cursor-pointer"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #ffb900, #ff637e)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
          </span>
          <div className="flex-1">
            <span className="block font-bold text-text-primary">人気キャラランキング</span>
            <span className="text-xs text-text-muted">投票で決まる最強キャラをチェック</span>
          </div>
          <svg className="h-5 w-5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
