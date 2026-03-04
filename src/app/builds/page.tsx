import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BuildsClient } from "./builds-client";

export const metadata: Metadata = {
  title: "編成ランキング | みんなで決めるトリッカルランキング",
  description:
    "トリッカルのおすすめ編成ランキング。PvP・PvEの人気編成をチェック",
};

export default async function BuildsPage() {
  const supabase = await createServerClient();

  // --- 話題のキャラクター（直近24時間）---
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentComments } = await supabase
    .from("comments")
    .select("character_id, user_hash")
    .eq("is_deleted", false)
    .gte("created_at", twentyFourHoursAgo);

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
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
        <div>
          <h1 className="text-xl font-bold text-text-primary">編成ランキング</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            人気のパーティ編成をチェック・投稿しよう
          </p>
        </div>
      </div>

      <BuildsClient />

      {/* 話題のキャラクター（直近24時間） */}
      {trendingCharacters.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#fb64b6] to-[#ffa1ad]" />
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                話題のキャラクター
              </h2>
              <p className="text-sm text-text-tertiary">今注目されているキャラクターをチェック！</p>
              <p className="text-xs text-text-muted">直近24時間</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {trendingCharacters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border-primary bg-bg-card/30 p-3 transition-colors hover:bg-bg-card-hover"
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
        <Link href="/ranking" className="flex items-center gap-3 rounded-2xl border border-border-primary bg-bg-card p-4 transition-colors hover:bg-bg-card-hover">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{backgroundImage: "linear-gradient(135deg, #fb64b6, #ffa1ad)"}}>
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <div>
            <span className="block font-bold text-text-primary">人気キャラランキング</span>
            <span className="text-xs text-text-tertiary">投票で決まる最強キャラをチェック</span>
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
