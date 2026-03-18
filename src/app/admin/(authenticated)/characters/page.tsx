import { createAdminClient } from "@/lib/supabase/admin";
import { CharacterEditor } from "../../_components/character-editor";
import type { Character, Item } from "@/types/database";

export default async function CharactersManagePage() {
  const supabase = createAdminClient();
  const [charactersResult, itemsResult] = await Promise.all([
    supabase
      .from("characters")
      .select("*")
      .order("created_at", { ascending: true })
      .returns<Character[]>(),
    supabase
      .from("items")
      .select("*")
      .order("item_type")
      .order("name")
      .returns<Item[]>(),
  ]);

  if (charactersResult.error) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-text-primary">キャラクター管理</h1>
        <div className="rounded-xl border border-thumbs-down/30 bg-thumbs-down/5 p-4 text-sm text-thumbs-down">
          データの取得に失敗しました: {charactersResult.error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-text-primary">キャラクター管理</h1>
        <p className="mt-1 text-sm text-text-secondary">
          全キャラデータの一括編集 — Tab: 横移動 / Enter: 下移動
        </p>
      </div>
      <CharacterEditor
        initialCharacters={charactersResult.data ?? []}
        initialItems={itemsResult.data ?? []}
      />
    </div>
  );
}
