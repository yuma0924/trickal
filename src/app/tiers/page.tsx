import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { TiersClient } from "./tiers-client";

type CharacterInfo = {
  id: string;
  name: string;
  image_url: string | null;
};

export const metadata: Metadata = {
  title: "ティアメーカー | みんなで決めるトリッカルランキング",
  description: "トリッカルのキャラクターをS〜Eの6段にランク付け。自分だけのティア表を作成・共有しよう",
};

export default async function TiersPage() {
  const supabase = await createServerClient();

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
            style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #ec4899)" }}
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </span>
          <h1 className="text-lg font-bold text-text-primary">ティアメーカー</h1>
        </div>
        <p className="mt-1 pl-[42px] text-xs md:text-sm text-text-muted">
          キャラクターをランク付けして共有しよう
        </p>
      </div>

      <TiersClient characters={characters} />
    </div>
  );
}
