import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "../_middleware";

/**
 * アイテム一覧取得 API
 * GET /api/admin/items
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("item_type")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

/**
 * アイテム新規作成 API
 * POST /api/admin/items
 * Body: { name: string, item_type: "favorite" | "reward" }
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, item_type } = body as { name?: string; item_type?: string };

    if (!name || !item_type) {
      return NextResponse.json(
        { error: "name と item_type は必須です" },
        { status: 400 }
      );
    }

    if (item_type !== "favorite" && item_type !== "reward") {
      return NextResponse.json(
        { error: "item_type は favorite または reward のみ" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("items")
      .insert({ name, item_type })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 }
    );
  }
}

/**
 * アイテム更新 API
 * PATCH /api/admin/items
 * Body: { id: string, name?: string, item_type?: string }
 */
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { id, ...fields } = (await request.json()) as {
      id: string;
      [key: string]: unknown;
    };

    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("items")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 }
    );
  }
}

/**
 * アイテム削除 API
 * DELETE /api/admin/items
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { id } = (await request.json()) as { id: string };

    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 }
    );
  }
}
