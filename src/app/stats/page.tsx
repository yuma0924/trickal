import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { StatsRankingClient } from "./stats-ranking-client";
import type { Element } from "@/lib/constants";

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
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          ステータス別ランキング
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
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
            <h2 className="text-base font-bold text-text-primary">
              話題のキャラクター
            </h2>
            <p className="text-xs text-text-tertiary">直近24時間のコメント数</p>
          </div>
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
    </div>
  );
}
