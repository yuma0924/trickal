import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserHash,
  isUserBanned,
  checkRateLimit,
  setCookieHeaders,
} from "@/app/api/_helpers";

const REPORT_RATE_LIMIT_SECONDS = 60;

/**
 * 通報 API
 * POST /api/reports
 * Body: {
 *   target_type: "comment" | "build" | "build_comment",
 *   target_id: string,
 *   reason?: string
 * }
 *
 * 仕様:
 * - 同一ユーザーによる同一対象への重複通報を防止 (UNIQUE制約)
 * - 同一対象に対して60秒に1回まで
 */
export async function POST(request: NextRequest) {
  let parsed: {
    target_type?: string;
    target_id?: string;
    reason?: string;
  };

  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { target_type, target_id, reason } = parsed;

  // バリデーション
  if (!target_type || !target_id) {
    return NextResponse.json(
      { error: "target_type and target_id are required" },
      { status: 400 }
    );
  }

  if (
    target_type !== "comment" &&
    target_type !== "build" &&
    target_type !== "build_comment"
  ) {
    return NextResponse.json(
      { error: "target_type must be 'comment', 'build', or 'build_comment'" },
      { status: 400 }
    );
  }

  // user_hash 生成
  let hashInfo;
  try {
    hashInfo = getUserHash(request);
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
  const { userHash, cookieUuid, isNewCookie } = hashInfo;

  const supabase = createAdminClient();

  // BAN チェック
  if (await isUserBanned(supabase, userHash)) {
    return NextResponse.json(
      { error: "操作できません" },
      { status: 403 }
    );
  }

  // レートリミット
  const { limited, retryAfter } = await checkRateLimit(
    supabase,
    "reports",
    { target_type, target_id, user_hash: userHash },
    REPORT_RATE_LIMIT_SECONDS
  );

  if (limited) {
    return NextResponse.json(
      {
        error: `通報間隔が短すぎます。${retryAfter}秒後にお試しください`,
        retry_after: retryAfter,
      },
      { status: 429 }
    );
  }

  // 重複通報チェック (UNIQUE制約に頼るが、わかりやすいエラーのため事前チェック)
  const { data: existingReport } = await supabase
    .from("reports")
    .select("id")
    .eq("target_type", target_type)
    .eq("target_id", target_id)
    .eq("user_hash", userHash)
    .single();

  if (existingReport) {
    return NextResponse.json(
      { error: "既に通報済みです" },
      { status: 409 }
    );
  }

  // 対象存在チェック
  const targetExists = await checkTargetExists(
    supabase,
    target_type as "comment" | "build" | "build_comment",
    target_id
  );

  if (!targetExists) {
    return NextResponse.json(
      { error: "Target not found" },
      { status: 404 }
    );
  }

  // 通報挿入
  const { data: report, error: insertError } = await supabase
    .from("reports")
    .insert({
      target_type: target_type as "comment" | "build" | "build_comment",
      target_id,
      user_hash: userHash,
      reason: reason ?? null,
    })
    .select()
    .single();

  if (insertError) {
    // UNIQUE制約違反の場合
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "既に通報済みです" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const headers = setCookieHeaders(cookieUuid, isNewCookie);
  return NextResponse.json({ report }, { status: 201, headers });
}

/**
 * 通報対象の存在確認
 */
async function checkTargetExists(
  supabase: ReturnType<typeof createAdminClient>,
  targetType: "comment" | "build" | "build_comment",
  targetId: string
): Promise<boolean> {
  switch (targetType) {
    case "comment": {
      const { data } = await supabase
        .from("comments")
        .select("id")
        .eq("id", targetId)
        .eq("is_deleted", false)
        .single();
      return !!data;
    }
    case "build": {
      const { data } = await supabase
        .from("builds")
        .select("id")
        .eq("id", targetId)
        .eq("is_deleted", false)
        .single();
      return !!data;
    }
    case "build_comment": {
      const { data } = await supabase
        .from("build_comments")
        .select("id")
        .eq("id", targetId)
        .eq("is_deleted", false)
        .single();
      return !!data;
    }
  }
}
