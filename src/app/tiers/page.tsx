import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { TiersClient } from "./tiers-client";

type CharacterInfo = {
  id: string;
  name: string;
  image_url: string | null;
};

export const revalidate = 600;

export const metadata: Metadata = {
  title: "みんなのティア表 | みんなで決めるトリッカルランキング",
  description: "トリッカルのキャラクターをS〜Eの6段にランク付け。自分だけのティア表を作成・共有しよう",
};

export default async function TiersPage() {
  const supabase = createAdminClient();

  // キャラクター情報を全件取得（ティアカードのプレビュー用）
  const { data: rawChars } = await supabase
    .from("characters")
    .select("id, name, image_url")
    .eq("is_hidden", false);

  const characters: Record<string, CharacterInfo> = {};
  if (rawChars) {
    for (const c of rawChars as CharacterInfo[]) {
      characters[c.id] = c;
    }
  }

  // 初期ティアデータを取得（新着順）
  const { data: initialTiers } = await supabase
    .from("tiers")
    .select("id, title, display_name, data, likes_count, created_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(21);

  const initialData = {
    tiers: (initialTiers ?? []).slice(0, 20).map((t) => ({
      id: t.id,
      title: t.title as string | null,
      display_name: t.display_name as string | null,
      data: t.data as Record<string, string[]>,
      likes_count: t.likes_count,
      user_liked: false,
      created_at: t.created_at,
    })),
    hasMore: (initialTiers ?? []).length > 20,
    nextCursor: (initialTiers ?? []).length > 20 ? (initialTiers ?? [])[19]?.id ?? null : null,
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
            style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #ec4899)" }}
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <rect x="0" y="0.5" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
              <rect x="4" y="0.5" width="12" height="3" rx="0.5" fill="white" />
              <rect x="0" y="4.5" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
              <rect x="4" y="4.5" width="9" height="3" rx="0.5" fill="white" />
              <rect x="0" y="8.5" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
              <rect x="4" y="8.5" width="6" height="3" rx="0.5" fill="white" />
              <rect x="0" y="12.5" width="3" height="3" rx="0.5" fill="white" opacity="0.7" />
              <rect x="4" y="12.5" width="4" height="3" rx="0.5" fill="white" />
            </svg>
          </span>
          <h1 className="text-lg font-bold text-text-primary">みんなのティア表</h1>
        </div>
        <p className="mt-1 pl-[42px] text-xs md:text-sm text-text-muted">
          キャラクターをランク付けして共有しよう
        </p>
      </div>

      <TiersClient characters={characters} initialData={initialData} />
    </div>
  );
}
