import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "../_middleware";

/**
 * 通報一覧取得 API
 * GET /api/admin/reports?status=pending&page=1&limit=50
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  let query = supabase
    .from("reports")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status === "pending" || status === "resolved" || status === "dismissed") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data, total: count });
}

/**
 * 通報ステータス更新 API
 * PATCH /api/admin/reports
 * Body: { id: string, status: 'resolved' | 'dismissed' }
 */
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { id, status } = (await request.json()) as {
      id: string;
      status: "resolved" | "dismissed";
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: "id と status は必須です" },
        { status: 400 }
      );
    }

    if (status !== "resolved" && status !== "dismissed") {
      return NextResponse.json(
        { error: "status は resolved または dismissed のみ指定可能です" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("reports")
      .update({ status })
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
