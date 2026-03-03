import type { Metadata } from "next";
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

  // 1位のキャラ名
  const topCharName = rankedCharacters.length > 0 ? rankedCharacters[0].name : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          人気キャラランキング
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          みんなの投票と評価で順位が決まる
        </p>
        <span className="mt-2 inline-block rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
          集計：毎日0時
        </span>
      </div>

      <RankingClient
        rankedCharacters={rankedCharacters}
        unrankedCharacters={unrankedCharacters}
        trendingCharacters={trendingCharacters}
        topCharName={topCharName}
      />
    </div>
  );
}
