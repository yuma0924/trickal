import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { TierCreateClient } from "./tier-create-client";

type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  image_url: string | null;
};

export const metadata: Metadata = {
  title: "ティア表作成 | みんなで決めるトリッカルランキング",
  description: "トリッカルのキャラクターをS〜Eの6段にランク付け。自分だけのティア表を作成しよう",
};

export default async function TierCreatePage() {
  const supabase = await createServerClient();

  const { data: rawChars } = await supabase
    .from("characters")
    .select("id, name, slug, element, image_url")
    .eq("is_hidden", false)
    .order("name");

  const characters = (rawChars as CharacterInfo[] | null) ?? [];

  return (
    <div className="-mx-4 space-y-4 md:mx-0">
      <div className="px-4 md:px-0">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]"
            style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #ec4899)" }}
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <h1 className="text-lg font-bold text-text-primary">ティア表作成</h1>
        </div>
        <p className="mt-1 pl-[42px] text-xs md:text-sm text-text-muted">
          キャラクターをドラッグ＆ドロップでランク付けしよう
        </p>
      </div>

      <div className="px-1 md:px-0">
        <TierCreateClient characters={characters} />
      </div>
    </div>
  );
}
