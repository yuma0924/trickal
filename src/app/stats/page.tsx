import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { StatsRankingClient } from "./stats-ranking-client";


export const metadata: Metadata = {
  title: "ステータス別ランキング | みんなで決めるトリッカルランキング",
  description: "トリッカル全キャラのステータス比較",
};

// ステータスキー定義
const STAT_KEYS = [
  { key: "hp", label: "HP" },
  { key: "patk", label: "物理攻撃" },
  { key: "matk", label: "魔法攻撃" },
  { key: "def", label: "防御" },
  { key: "spd", label: "速度" },
  { key: "crit", label: "クリティカル" },
] as const;

export type StatKey = (typeof STAT_KEYS)[number]["key"];

interface CharacterWithStats {
  id: string;
  slug: string;
  name: string;
  element: string | null;
  role: string | null;
  imageUrl: string | null;
  stats: Record<string, number | null>;
  avgRating: number | null;
  validVotesCount: number;
}

export default async function StatsPage() {
  const supabase = await createServerClient();

  // 全キャラ（非表示除く）+ ランキング情報を取得
  const { data: characters } = await supabase
    .from("characters")
    .select("id, slug, name, element, role, image_url, stats, is_provisional")
    .eq("is_hidden", false)
    .order("name");

  const { data: rankings } = await supabase
    .from("character_rankings")
    .select("character_id, avg_rating, valid_votes_count");

  // ランキングマップ
  const rankingMap = new Map<string, { avgRating: number; validVotesCount: number }>();
  if (rankings) {
    for (const r of rankings) {
      rankingMap.set(r.character_id, {
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
      });
    }
  }

  // データ整形
  const characterData: CharacterWithStats[] = (characters ?? []).map((c) => {
    const ranking = rankingMap.get(c.id);
    const rawStats = (c.stats as Record<string, unknown>) ?? {};

    const stats: Record<string, number | null> = {};
    for (const { key } of STAT_KEYS) {
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
      avgRating: ranking?.avgRating ?? null,
      validVotesCount: ranking?.validVotesCount ?? 0,
    };
  });

  // --- 話題のキャラクター（直近24時間）---
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

  const trendingEntries = Array.from(trendingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  interface TrendingChar {
    id: string;
    slug: string;
    name: string;
    element: string | null;
    imageUrl: string | null;
    commentCount: number;
  }

  const trendingCharacters: TrendingChar[] = trendingEntries
    .map(([id, count]) => {
      const char = charMap.get(id);
      if (!char) return null;
      return {
        id,
        slug: char.slug,
        name: char.name,
        element: char.element,
        imageUrl: char.imageUrl,
        commentCount: count,
      };
    })
    .filter((c): c is TrendingChar => c !== null);

  return (
    <div className="space-y-6">
      {/* セクション見出し（左バーパターン） */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
          <h1 className="text-xl font-bold text-text-primary">
            ステータス別ランキング
          </h1>
        </div>
        <p className="mt-2 pl-4 text-sm text-text-tertiary">
          全キャラのステータスを比較
        </p>
      </div>

      <StatsRankingClient
        characters={characterData}
        statKeys={STAT_KEYS.map((s) => ({ key: s.key, label: s.label }))}
      />

      {/* 話題のキャラクター（直近24時間） */}
      {trendingCharacters.length > 0 && (
        <section className="space-y-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
              <h2 className="text-base font-bold text-text-primary">
                話題のキャラクター
              </h2>
            </div>
            <p className="mt-1 pl-4 text-xs text-text-tertiary">直近24時間のコメント数</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border-primary bg-bg-card/30 p-3 transition-colors hover:bg-bg-card-hover cursor-pointer"
              >
                <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-border-primary">
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

      {/* ページ下部ナビリンク */}
      <div className="mt-8 space-y-3">
        <p className="pl-1 text-sm font-bold text-text-primary">他のランキングもチェック</p>
        <Link
          href="/ranking"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #fb64b6, #ffa1ad)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">人気キャラランキング</span>
            <span className="text-xs text-text-tertiary">投票で決まる最強キャラをチェック</span>
          </div>
        </Link>
        <Link
          href="/builds"
          className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundImage: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">編成ランキング</span>
            <span className="text-xs text-text-tertiary">人気のパーティ編成をチェックしよう</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
