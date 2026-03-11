import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { CharacterDetailClient } from "./character-detail-client";
import type { Element } from "@/lib/constants";
import type { Character } from "@/types/database";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();
  const { data: character } = await supabase
    .from("characters")
    .select("name")
    .eq("slug", slug)
    .eq("is_hidden", false)
    .single();

  if (!character) {
    return { title: "キャラクター | みんなで決めるトリッカルランキング" };
  }

  return {
    title: `${character.name} | みんなで決めるトリッカルランキング`,
    description: `${character.name}の性能・評価・みんなのコメント`,
  };
}

export interface CharacterDetail {
  id: string;
  slug: string;
  name: string;
  rarity: string | null;
  element: Element | null;
  role: string | null;
  race: string | null;
  position: string | null;
  attackType: string | null;
  stats: Record<string, number | null>;
  skills: unknown;
  metadata: unknown;
  imageUrl: string | null;
  isProvisional: boolean;
  avgRating: number | null;
  validVotesCount: number;
  boardCommentsCount: number;
  rank: number | null;
}

export interface RelatedCharacter {
  id: string;
  slug: string;
  name: string;
  element: Element | null;
  imageUrl: string | null;
  avgRating: number | null;
  validVotesCount: number;
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // キャラ情報取得
  const { data: character } = await supabase
    .from("characters")
    .select("id, slug, name, rarity, element, role, race, position, attack_type, stats, skills, metadata, image_url, is_provisional, is_hidden, created_at, updated_at")
    .eq("slug", slug)
    .eq("is_hidden", false)
    .returns<Character[]>()
    .single();

  if (!character) {
    notFound();
  }

  // ランキング情報取得
  const { data: ranking } = await supabase
    .from("character_rankings")
    .select("avg_rating, valid_votes_count, board_comments_count, rank")
    .eq("character_id", character.id)
    .single();

  // 同属性・同レアリティの関連キャラ取得
  type RelatedRow = { id: string; slug: string; name: string; element: string | null; image_url: string | null };
  let relatedQuery = supabase
    .from("characters")
    .select("id, slug, name, element, image_url")
    .eq("is_hidden", false)
    .neq("id", character.id);

  if (character.element) {
    relatedQuery = relatedQuery.eq("element", character.element);
  }
  if (character.rarity) {
    relatedQuery = relatedQuery.eq("rarity", character.rarity);
  }

  const { data: relatedChars } = await relatedQuery.limit(8).returns<RelatedRow[]>();

  // 関連キャラのランキングを取得
  const relatedIds = (relatedChars ?? []).map((c) => c.id);
  const { data: relatedRankings } = relatedIds.length > 0
    ? await supabase
        .from("character_rankings")
        .select("character_id, avg_rating, valid_votes_count")
        .in("character_id", relatedIds)
    : { data: [] };

  const relatedRankMap = new Map<string, { avgRating: number; validVotesCount: number }>();
  if (relatedRankings) {
    for (const r of relatedRankings) {
      relatedRankMap.set(r.character_id, {
        avgRating: r.avg_rating,
        validVotesCount: r.valid_votes_count,
      });
    }
  }

  const relatedCharacters: RelatedCharacter[] = (relatedChars ?? []).map((c) => {
    const rr = relatedRankMap.get(c.id);
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      element: c.element as Element | null,
      imageUrl: c.image_url,
      avgRating: rr?.avgRating ?? null,
      validVotesCount: rr?.validVotesCount ?? 0,
    };
  });

  const rawStats = (character.stats as Record<string, unknown>) ?? {};
  const stats: Record<string, number | null> = {};
  for (const [key, val] of Object.entries(rawStats)) {
    stats[key] = typeof val === "number" ? val : null;
  }

  const characterDetail: CharacterDetail = {
    id: character.id,
    slug: character.slug,
    name: character.name,
    rarity: character.rarity,
    element: character.element as Element | null,
    role: character.role,
    race: character.race,
    position: character.position,
    attackType: character.attack_type,
    stats,
    skills: character.skills,
    metadata: character.metadata,
    imageUrl: character.image_url,
    isProvisional: character.is_provisional,
    avgRating: ranking?.avg_rating ?? null,
    validVotesCount: ranking?.valid_votes_count ?? 0,
    boardCommentsCount: ranking?.board_comments_count ?? 0,
    rank: ranking?.rank ?? null,
  };

  return (
    <CharacterDetailClient
      character={characterDetail}
      relatedCharacters={relatedCharacters}
    />
  );
}
