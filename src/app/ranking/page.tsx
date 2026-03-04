import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { RankingClient } from "./ranking-client";
import type { Element } from "@/lib/constants";

export const metadata: Metadata = {
  title: "人気キャラランキング | みんなで決めるトリッカルランキング",
  description:
    "トリッカルの人気キャラランキング。みんなの投票と評価で順位が決まる",
};

export interface RankedCharacter {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  avgRating: number;
  validVotesCount: number;
  boardCommentsCount: number;
  rank: number | null;
}

export interface UnrankedCharacter {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  avgRating: number;
  validVotesCount: number;
}

export interface TrendingCharacter {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  avgRating: number | null;
  validVotesCount: number;
  commentCount: number;
}

export default async function RankingPage() {
  const supabase = await createServerClient();

  // ランキングデータ + キャラ情報を取得
  const { data: rankings } = await supabase
    .from("character_rankings")
    .select(
      "character_id, avg_rating, valid_votes_count, board_comments_count, rank"
    )
    .order("rank", { ascending: true, nullsFirst: false });

  const { data: characters } = await supabase
    .from("characters")
    .select("id, slug, name, element, image_url")
    .eq("is_hidden", false);

  // キャラマップ
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

  // ランク付きキャラ（有効票4件以上）
  const rankedCharacters: RankedCharacter[] = [];
  // ランクなしキャラ（有効票0〜3件）
  const unrankedCharacters: UnrankedCharacter[] = [];

  if (rankings) {
    for (const r of rankings) {
      const char = charMap.get(r.character_id);
      if (!char) continue;

      if (r.rank !== null && r.valid_votes_count >= 4) {
        rankedCharacters.push({
          id: r.character_id,
          slug: char.slug,
          name: char.name,
          element: char.element as Element | null,
          imageUrl: char.imageUrl,
          avgRating: r.avg_rating,
          validVotesCount: r.valid_votes_count,
          boardCommentsCount: r.board_comments_count,
          rank: r.rank,
        });
      } else {
        unrankedCharacters.push({
          id: r.character_id,
          slug: char.slug,
          name: char.name,
          element: char.element as Element | null,
          imageUrl: char.imageUrl,
          avgRating: r.avg_rating,
          validVotesCount: r.valid_votes_count,
        });
      }
    }
  }

  // 未ランクのソート: 有効票数降順 -> 平均点降順
  unrankedCharacters.sort((a, b) => {
    if (b.validVotesCount !== a.validVotesCount)
      return b.validVotesCount - a.validVotesCount;
    return b.avgRating - a.avgRating;
  });

  // --- 注目のキャラクター（直近24時間）---
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

  // ランキングマップ（話題キャラの評価情報用）
  const rankingLookup = new Map<string, { avgRating: number; validVotesCount: number }>();
  if (rankings) {
    for (const r of rankings) {
      rankingLookup.set(r.character_id, {
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
      });
    }
  }

  const trendingEntries = Array.from(trendingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const trendingCharacters: TrendingCharacter[] = trendingEntries
    .map(([id, count]) => {
      const char = charMap.get(id);
      if (!char) return null;
      const rr = rankingLookup.get(id);
      return {
        id,
        slug: char.slug,
        name: char.name,
        element: char.element as Element | null,
        imageUrl: char.imageUrl,
        avgRating: rr?.avgRating ?? null,
        validVotesCount: rr?.validVotesCount ?? 0,
        commentCount: count,
      };
    })
    .filter((c): c is TrendingCharacter => c !== null);

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#fb64b6]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h1 className="text-xl font-bold text-text-primary">
              人気キャラランキング
            </h1>
          </div>
        </div>
        <p className="mt-2 ml-7 text-sm text-text-tertiary">
          みんなの投票と評価で順位が決まる
        </p>
        <span className="mt-2 ml-7 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
          集計：毎日0時
        </span>
      </div>

      <RankingClient
        rankedCharacters={rankedCharacters}
        unrankedCharacters={unrankedCharacters}
        trendingCharacters={trendingCharacters}
      />

      {/* ページ下部ナビリンク */}
      <div className="mt-8 space-y-3">
        <p className="pl-1 text-sm font-bold text-text-primary">他のランキングもチェック</p>
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
