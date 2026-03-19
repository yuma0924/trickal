import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "../../_middleware";

/**
 * キャラクターのアルバイト報酬アイテムを一括更新
 * PUT /api/admin/characters/rewards
 * Body: { character_id: string, item_ids: string[] }
 */
export async function PUT(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { character_id, item_ids } = (await request.json()) as {
      character_id: string;
      item_ids: string[];
    };

    if (!character_id) {
      return NextResponse.json({ error: "character_id は必須です" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 既存の報酬を全削除
    const { error: deleteError } = await supabase
      .from("character_rewards")
      .delete()
      .eq("character_id", character_id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 新しい報酬を挿入
    if (item_ids.length > 0) {
      const rows = item_ids.map((item_id, i) => ({
        character_id,
        item_id,
        sort_order: i,
      }));

      const { error: insertError } = await supabase
        .from("character_rewards")
        .insert(rows);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 }
    );
  }
}
