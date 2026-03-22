import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BuildDetailClient } from "./build-detail-client";


type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  position: string | null;
  image_url: string | null;
  is_hidden: boolean;
};

type Mode = "general" | "arena" | "dimension" | "world_tree";

const MODE_LABEL_MAP: Record<Mode, string> = {
  general: "汎用編成",
  arena: "PvP",
  dimension: "次元の衝突",
  world_tree: "世界樹採掘基地",
};

type BuildData = {
  id: string;
  mode: Mode;
  party_size: number;
  members: (string | null)[];
  element_label: string | null;
  title: string | null;
  display_name: string | null;
  comment: string;
  likes_count: number;
  dislikes_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_hash: string;
};

type SimilarBuild = {
  id: string;
  mode: Mode;
  title: string | null;
  display_name: string | null;
  comment: string;
  element_label: string | null;
  likes_count: number;
  members_detail: CharacterInfo[];
  updated_at: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ buildId: string }>;
}): Promise<Metadata> {
  const { buildId } = await params;
  const supabase = await createServerClient();

  const { data: build } = await supabase
    .from("builds")
    .select("title, element_label, mode")
    .eq("id", buildId)
    .single();

  if (!build) {
    return {
      title: "編成が見つかりません | みんなで決めるトリッカルランキング",
    };
  }

  const buildData = build as { title: string | null; element_label: string | null; mode: string };
  const modeLabel = MODE_LABEL_MAP[buildData.mode as Mode] ?? buildData.mode;
  const title = buildData.title || `${buildData.element_label ?? ""}${modeLabel}`;

  return {
    title: `${title} | 人気編成ランキング | みんなで決めるトリッカルランキング`,
    description: `トリッカルの編成「${title}」の詳細・コメント`,
  };
}

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ buildId: string }>;
}) {
  const { buildId } = await params;
  const supabase = await createServerClient();

  // 編成データ取得
  const { data: rawBuild } = await supabase
    .from("builds")
    .select("*")
    .eq("id", buildId)
    .single();

  if (!rawBuild) {
    notFound();
  }

  const build = rawBuild as BuildData;

  if (build.is_deleted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-text-secondary">この編成は削除されました</p>
      </div>
    );
  }

  // メンバーのキャラ情報
  const actualMemberIds = build.members.filter((id): id is string => id !== null);
  const { data: rawChars } = actualMemberIds.length > 0
    ? await supabase
        .from("characters")
        .select("id, name, slug, element, position, image_url, is_hidden")
        .in("id", actualMemberIds)
    : { data: [] };

  const charMap = new Map(
    ((rawChars as CharacterInfo[] | null) ?? []).map((c) => [c.id, c])
  );

  const membersDetail = actualMemberIds.map(
    (id) =>
      charMap.get(id) ?? {
        id,
        name: "不明",
        slug: "",
        element: null,
        position: null,
        image_url: null,
        is_hidden: false,
      }
  );

  // 似ている編成
  const { data: rawCandidates } = await supabase
    .from("builds")
    .select("*")
    .eq("is_deleted", false)
    .neq("id", buildId)
    .eq("mode", build.mode)
    .order("likes_count", { ascending: false })
    .limit(20);

  const candidates = ((rawCandidates as BuildData[] | null) ?? [])
    .map((sb) => ({
      ...sb,
      commonCount: sb.members.filter((m): m is string => m !== null).filter((m) => actualMemberIds.includes(m)).length,
      sameElement: sb.element_label === build.element_label,
    }))
    .filter((sb) => sb.commonCount > 0 || sb.sameElement)
    .sort((a, b) => {
      if (b.commonCount !== a.commonCount) return b.commonCount - a.commonCount;
      return b.likes_count - a.likes_count;
    })
    .slice(0, 5);

  // 似ている編成のキャラ情報
  const similarMemberIds = [
    ...new Set(candidates.flatMap((sb) => sb.members).filter((id): id is string => id !== null)),
  ];
  if (similarMemberIds.length > 0) {
    const { data: sc } = await supabase
      .from("characters")
      .select("id, name, slug, element, position, image_url, is_hidden")
      .in("id", similarMemberIds);

    for (const c of (sc as CharacterInfo[] | null) ?? []) {
      if (!charMap.has(c.id)) charMap.set(c.id, c);
    }
  }

  const similarBuilds: SimilarBuild[] = candidates.map((sb) => ({
    id: sb.id,
    mode: sb.mode,
    title: sb.title,
    display_name: sb.display_name,
    comment: sb.comment,
    element_label: sb.element_label,
    likes_count: sb.likes_count,
    members_detail: sb.members.filter((id): id is string => id !== null).map(
      (id) =>
        charMap.get(id) ?? {
          id,
          name: "不明",
          slug: "",
          element: null,
          position: null,
          image_url: null,
          is_hidden: false,
        }
    ),
    updated_at: sb.updated_at,
  }));

  return (
    <BuildDetailClient
      build={{
        id: build.id,
        mode: build.mode,
        party_size: build.party_size,
        element_label: build.element_label,
        title: build.title,
        display_name: build.display_name,
        comment: build.comment,
        likes_count: build.likes_count,
        dislikes_count: build.dislikes_count,
        created_at: build.created_at,
        updated_at: build.updated_at,
        members: build.members,
        members_detail: membersDetail,
      }}
      similarBuilds={similarBuilds}
    />
  );
}
