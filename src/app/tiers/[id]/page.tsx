import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TierDetailClient } from "./tier-detail-client";

type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  image_url: string | null;
};

type TierData = {
  id: string;
  title: string | null;
  display_name: string | null;
  data: Record<string, string[]>;
  likes_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_hash: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: tier } = await supabase
    .from("tiers")
    .select("title")
    .eq("id", id)
    .single();

  if (!tier) {
    return {
      title: "ティアが見つかりません | みんなで決めるトリッカルランキング",
    };
  }

  const title = (tier as { title: string | null }).title || "無題のティア";
  return {
    title: `${title} | みんなのティア表 | みんなで決めるトリッカルランキング`,
    description: `トリッカルのティア表「${title}」を見る`,
  };
}

export default async function TierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: rawTier } = await supabase
    .from("tiers")
    .select("*")
    .eq("id", id)
    .single();

  if (!rawTier) {
    notFound();
  }

  const tier = rawTier as TierData;

  if (tier.is_deleted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-text-secondary">このティアは削除されました</p>
      </div>
    );
  }

  // ティアに含まれる全キャラクター情報を取得
  const allCharIds = Object.values(tier.data).flat();
  let characters: Record<string, CharacterInfo> = {};

  if (allCharIds.length > 0) {
    const { data: chars } = await supabase
      .from("characters")
      .select("id, name, slug, element, image_url")
      .in("id", allCharIds);

    if (chars) {
      characters = Object.fromEntries(
        (chars as CharacterInfo[]).map((c) => [c.id, c])
      );
    }
  }

  return (
    <TierDetailClient
      tier={{
        id: tier.id,
        title: tier.title,
        display_name: tier.display_name,
        data: tier.data,
        likes_count: tier.likes_count,
        created_at: tier.created_at,
      }}
      characters={characters}
    />
  );
}
