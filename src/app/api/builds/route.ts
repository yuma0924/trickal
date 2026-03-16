import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { Build } from "@/types/database";
import {
  getUserHash,
  isUserBanned,
  checkRateLimit,
  setCookieHeaders,
} from "@/app/api/_helpers";

const PAGE_SIZE = 20;
const BUILD_RATE_LIMIT_SECONDS = 30;

type CharacterInfo = {
  id: string;
  name: string;
  slug: string;
  element: string | null;
  image_url: string | null;
  is_hidden: boolean;
};

type ReactionRow = { build_id: string; reaction_type: "up" | "down" };

/**
 * GET /api/builds
 * 編成一覧を取得
 *
 * クエリパラメータ:
 * - mode: 'pvp' | 'pve'（必須）
 * - element: 属性フィルター（任意: '火','水','風','光','闇','混合'）
 * - cursor: ページネーションカーソル（最後の build の ID）
 * - limit: 取得件数（デフォルト20）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get("mode");
    const elementParam = searchParams.get("element");
    // カンマ区切りで複数性格対応、複数指定時は「混合」も含める
    const elementLabels: string[] = elementParam
      ? (() => {
          const elems = elementParam.split(",").filter(Boolean);
          if (elems.length > 1) return [...elems, "混合"];
          return elems;
        })()
      : [];
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      Number(searchParams.get("limit")) || PAGE_SIZE,
      50
    );

    const VALID_MODES = ["general", "arena", "dimension", "world_tree"] as const;
    type ValidMode = (typeof VALID_MODES)[number];
    if (!mode || !(VALID_MODES as readonly string[]).includes(mode)) {
      return NextResponse.json(
        { error: "mode パラメータは 'general', 'arena', 'dimension', 'world_tree' のいずれかを指定してください" },
        { status: 400 }
      );
    }
    const validMode = mode as ValidMode;

    const supabase = createAdminClient();

    let builds: Build[] = [];
    let queryError: string | null = null;

    if (cursor) {
      // カーソルIDのビルドを取得して比較基準を得る
      const { data: cursorBuild } = await supabase
        .from("builds")
        .select("likes_count, updated_at")
        .eq("id", cursor)
        .single();

      if (cursorBuild) {
        let q = supabase
          .from("builds")
          .select("*")
          .eq("mode", validMode)
          .eq("is_deleted", false)
          .or(
            `likes_count.lt.${cursorBuild.likes_count},` +
            `and(likes_count.eq.${cursorBuild.likes_count},updated_at.lt.${cursorBuild.updated_at})`
          );

        if (elementLabels.length > 0) q = q.in("element_label", elementLabels);

        const { data, error } = await q
          .order("likes_count", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(limit + 1);

        if (error) queryError = error.message;
        builds = (data as Build[]) ?? [];
      }
    }

    if (!cursor || builds.length === 0) {
      if (!queryError) {
        let q = supabase
          .from("builds")
          .select("*")
          .eq("mode", validMode)
          .eq("is_deleted", false);

        if (elementLabels.length > 0) q = q.in("element_label", elementLabels);

        const { data, error } = await q
          .order("likes_count", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(limit + 1);

        if (error) queryError = error.message;
        builds = (data as Build[]) ?? [];
      }
    }

    if (queryError) {
      return NextResponse.json({ error: queryError }, { status: 500 });
    }

    const hasMore = builds.length > limit;
    const items = builds.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // メンバーのキャラ情報を取得
    const memberIds = [...new Set(items.flatMap((b) => b.members))];
    let characters: Record<string, CharacterInfo> = {};

    if (memberIds.length > 0) {
      const { data: chars } = await supabase
        .from("characters")
        .select("id, name, slug, element, image_url, is_hidden")
        .in("id", memberIds);

      if (chars) {
        characters = Object.fromEntries(
          (chars as CharacterInfo[]).map((c) => [c.id, c])
        );
      }
    }

    // ユーザーのリアクション状態を取得
    const { userHash } = getUserHash(request);
    const buildIds = items.map((b) => b.id);
    let userReactions: Record<string, "up" | "down"> = {};

    if (buildIds.length > 0) {
      const { data: reactions } = await supabase
        .from("build_reactions")
        .select("build_id, reaction_type")
        .eq("user_hash", userHash)
        .in("build_id", buildIds);

      if (reactions) {
        userReactions = Object.fromEntries(
          (reactions as ReactionRow[]).map((r) => [r.build_id, r.reaction_type])
        );
      }
    }

    // コメント件数を取得
    let commentCounts: Record<string, number> = {};
    if (buildIds.length > 0) {
      const { data: counts } = await supabase
        .from("build_comments")
        .select("build_id")
        .in("build_id", buildIds)
        .eq("is_deleted", false);

      if (counts) {
        for (const row of counts) {
          commentCounts[row.build_id] = (commentCounts[row.build_id] ?? 0) + 1;
        }
      }
    }

    const fallbackChar: Omit<CharacterInfo, "id"> = {
      name: "不明",
      slug: "",
      element: null,
      image_url: null,
      is_hidden: false,
    };

    return NextResponse.json({
      builds: items.map((b) => ({
        ...b,
        members_detail: b.members.map(
          (id) => characters[id] || { id, ...fallbackChar }
        ),
        user_reaction: userReactions[b.id] || null,
        comments_count: commentCounts[b.id] ?? 0,
      })),
      next_cursor: nextCursor,
      has_more: hasMore,
    });
  } catch (error) {
    console.error("GET /api/builds error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/builds
 * 編成を投稿（同一 user_hash * mode * party_size は上書き）
 *
 * ボディ:
 * - mode: 'pvp' | 'pve'
 * - members: string[]（キャラID配列、party_sizeと同じ長さ）
 * - comment: string（最大200文字）
 * - title?: string（編成名、任意）
 * - display_name?: string（投稿者名、任意）
 */
export async function POST(request: NextRequest) {
  try {
    const { userHash, cookieUuid, isNewCookie } = getUserHash(request);
    const supabase = createAdminClient();

    // BAN チェック
    if (await isUserBanned(supabase, userHash)) {
      return NextResponse.json(
        { error: "投稿できませんでした。時間をおいて再度お試しください。" },
        { status: 403 }
      );
    }

    // レートリミットチェック（30秒に1回）
    const { limited, retryAfter } = await checkRateLimit(
      supabase,
      "builds",
      { user_hash: userHash },
      BUILD_RATE_LIMIT_SECONDS
    );

    if (limited) {
      return NextResponse.json(
        {
          error: `投稿間隔が短すぎます。${retryAfter}秒後に再度お試しください。`,
          retry_after: retryAfter,
        },
        { status: 429 }
      );
    }

    let parsed: {
      mode?: string;
      members?: string[];
      comment?: string;
      title?: string;
      display_name?: string;
    };

    try {
      parsed = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { mode, members, comment, title, display_name } = parsed;

    // バリデーション
    const VALID_MODES_POST = ["general", "arena", "dimension", "world_tree"] as const;
    type ValidModePost = (typeof VALID_MODES_POST)[number];
    if (!mode || !(VALID_MODES_POST as readonly string[]).includes(mode)) {
      return NextResponse.json(
        { error: "mode は 'general', 'arena', 'dimension', 'world_tree' のいずれかを指定してください" },
        { status: 400 }
      );
    }
    const validModePost = mode as ValidModePost;

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: "members は必須です" },
        { status: 400 }
      );
    }

    const maxPartySize = validModePost === "dimension" ? 9 : 6;
    if (members.length > maxPartySize) {
      return NextResponse.json(
        { error: `メンバーは${maxPartySize}人以内で選択してください` },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      return NextResponse.json(
        { error: "コメントは必須です" },
        { status: 400 }
      );
    }

    if (comment.length > 200) {
      return NextResponse.json(
        { error: "コメントは200文字以内で入力してください" },
        { status: 400 }
      );
    }

    if (title && typeof title === "string" && title.length > 100) {
      return NextResponse.json(
        { error: "タイトルは100文字以内で入力してください" },
        { status: 400 }
      );
    }

    // メンバーの存在確認 + 属性取得
    const { data: chars, error: charsError } = await supabase
      .from("characters")
      .select("id, element")
      .in("id", members);

    if (charsError) {
      return NextResponse.json(
        { error: "キャラクター情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    const charList = chars as { id: string; element: string | null }[] | null;

    if (!charList || charList.length !== members.length) {
      return NextResponse.json(
        { error: "無効なキャラクターが含まれています" },
        { status: 400 }
      );
    }

    // 属性ラベル自動生成
    const elements = charList.map((c) => c.element).filter(Boolean);
    const uniqueElements = [...new Set(elements)];
    const elementLabel =
      uniqueElements.length === 1 ? uniqueElements[0]! : "混合";

    const modeLabelMap: Record<string, string> = {
      general: "汎用編成",
      arena: "PvP",
      dimension: "次元の衝突",
      world_tree: "世界樹採掘基地",
    };
    const finalTitle =
      title?.trim() || (modeLabelMap[validModePost] ?? validModePost);
    const finalDisplayName = display_name?.trim() || DEFAULT_DISPLAY_NAME;

    const actualPartySize = members.length;

    // 同一 user_hash * mode の既存投稿を検索（上書き判定）
    const { data: existing } = await supabase
      .from("builds")
      .select("id")
      .eq("user_hash", userHash)
      .eq("mode", validModePost)
      .eq("is_deleted", false)
      .single();

    const existingRow = existing as { id: string } | null;
    const headers = setCookieHeaders(cookieUuid, isNewCookie);

    if (existingRow) {
      // 上書き更新
      const { data: updated, error: updateError } = await supabase
        .from("builds")
        .update({
          members,
          party_size: actualPartySize,
          element_label: elementLabel,
          title: finalTitle,
          display_name: finalDisplayName,
          comment: comment.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRow.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { build: updated, updated: true },
        { headers }
      );
    }

    // 新規投稿
    const { data: newBuild, error: insertError } = await supabase
      .from("builds")
      .insert({
        mode: validModePost,
        party_size: actualPartySize,
        members,
        element_label: elementLabel,
        title: finalTitle,
        display_name: finalDisplayName,
        comment: comment.trim(),
        user_hash: userHash,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { build: newBuild, updated: false },
      { status: 201, headers }
    );
  } catch (error) {
    console.error("POST /api/builds error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
