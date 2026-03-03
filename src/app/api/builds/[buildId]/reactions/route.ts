import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserHash,
  isUserBanned,
  setCookieHeaders,
} from "@/app/api/_helpers";

type BuildRow = { id: string; likes_count: number; dislikes_count: number };
type ReactionRow = { id: string; reaction_type: "up" | "down" };

/**
 * POST /api/builds/[buildId]/reactions
 * 編成に対する👍/👎リアクション
 *
 * ボディ:
 * - reaction_type: 'up' | 'down' | null（nullで取り消し）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    const { userHash, cookieUuid, isNewCookie } = getUserHash(request);
    const supabase = createAdminClient();

    // BAN チェック
    if (await isUserBanned(supabase, userHash)) {
      return NextResponse.json(
        { error: "操作できませんでした。時間をおいて再度お試しください。" },
        { status: 403 }
      );
    }

    let parsed: { reaction_type?: string | null };
    try {
      parsed = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { reaction_type } = parsed;

    if (
      reaction_type !== "up" &&
      reaction_type !== "down" &&
      reaction_type !== null
    ) {
      return NextResponse.json(
        { error: "reaction_type は 'up', 'down', null のいずれかを指定してください" },
        { status: 400 }
      );
    }

    // 編成の存在確認
    const { data: rawBuild } = await supabase
      .from("builds")
      .select("id, likes_count, dislikes_count")
      .eq("id", buildId)
      .eq("is_deleted", false)
      .single();

    const build = rawBuild as BuildRow | null;

    if (!build) {
      return NextResponse.json(
        { error: "編成が見つかりません" },
        { status: 404 }
      );
    }

    // 既存のリアクションを確認
    const { data: rawExisting } = await supabase
      .from("build_reactions")
      .select("id, reaction_type")
      .eq("build_id", buildId)
      .eq("user_hash", userHash)
      .single();

    const existing = rawExisting as ReactionRow | null;

    let newLikesCount = build.likes_count;
    let newDislikesCount = build.dislikes_count;

    if (reaction_type === null) {
      // 取り消し
      if (existing) {
        if (existing.reaction_type === "up") newLikesCount--;
        if (existing.reaction_type === "down") newDislikesCount--;

        await supabase
          .from("build_reactions")
          .delete()
          .eq("id", existing.id);
      }
    } else if (existing) {
      // 変更
      if (existing.reaction_type !== reaction_type) {
        if (existing.reaction_type === "up") newLikesCount--;
        if (existing.reaction_type === "down") newDislikesCount--;
        if (reaction_type === "up") newLikesCount++;
        if (reaction_type === "down") newDislikesCount++;

        await supabase
          .from("build_reactions")
          .update({
            reaction_type: reaction_type as "up" | "down",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      }
    } else {
      // 新規
      if (reaction_type === "up") newLikesCount++;
      if (reaction_type === "down") newDislikesCount++;

      await supabase.from("build_reactions").insert({
        build_id: buildId,
        user_hash: userHash,
        reaction_type: reaction_type as "up" | "down",
      });
    }

    // カウントを更新
    await supabase
      .from("builds")
      .update({
        likes_count: newLikesCount,
        dislikes_count: newDislikesCount,
      })
      .eq("id", buildId);

    const headers = setCookieHeaders(cookieUuid, isNewCookie);
    return NextResponse.json(
      {
        likes_count: newLikesCount,
        dislikes_count: newDislikesCount,
        user_reaction: reaction_type,
      },
      { headers }
    );
  } catch (error) {
    console.error("POST /api/builds/[buildId]/reactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
