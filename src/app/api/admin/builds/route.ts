import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "../_middleware";

/**
 * 編成一覧取得 API
 * GET /api/admin/builds?page=1&limit=50&deleted=false
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const deleted = searchParams.get("deleted") === "true";
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();
  const { data, error, count } = await supabase
    .from("builds")
    .select("*", { count: "exact" })
    .eq("is_deleted", deleted)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ builds: data, total: count });
}

/**
 * 編成論理削除/復元 API
 * PATCH /api/admin/builds
 * Body: { id: string, action: 'delete' | 'restore' }
 */
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { id, action } = (await request.json()) as {
      id: string;
      action: "delete" | "restore";
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "id と action は必須です" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("builds")
      .update({
        is_deleted: action === "delete",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

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
