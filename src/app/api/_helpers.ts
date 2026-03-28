import { NextRequest } from "next/server";
import { createHash, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const COOKIE_NAME = "trickal_uid";

/**
 * リクエストから user_hash を生成する
 * Cookie UUID がない場合は新規生成し、レスポンスで Set-Cookie する必要がある
 */
export function getUserHash(request: NextRequest): {
  userHash: string;
  cookieUuid: string;
  isNewCookie: boolean;
} {
  const serverSecret = process.env.USER_HASH_SECRET;
  if (!serverSecret) {
    throw new Error("USER_HASH_SECRET is not configured");
  }

  let cookieUuid = request.cookies.get(COOKIE_NAME)?.value;
  const isNewCookie = !cookieUuid;

  if (!cookieUuid) {
    cookieUuid = randomUUID();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") ?? "unknown";

  const userHash = createHash("sha256")
    .update(`${cookieUuid}${clientIp}${serverSecret}`)
    .digest("hex");

  return { userHash, cookieUuid, isNewCookie };
}

/**
 * user_hash が BAN されているかチェックする
 */
export async function isUserBanned(
  supabase: SupabaseClient<Database>,
  userHash: string
): Promise<boolean> {
  const { data } = await supabase
    .from("blacklist")
    .select("id")
    .eq("user_hash", userHash)
    .limit(1)
    .single();

  return !!data;
}

/**
 * レートリミットチェック
 * 指定テーブル・条件で最終投稿時刻を確認し、制限時間内かどうかを返す
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  table: "comments" | "builds" | "build_comments" | "reports" | "tiers" | "tier_comments",
  filters: Record<string, string>,
  limitSeconds: number
): Promise<{ limited: boolean; retryAfter?: number }> {
  let query = supabase
    .from(table)
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    return { limited: false };
  }

  const lastCreatedAt = new Date(data[0].created_at).getTime();
  const now = Date.now();
  const elapsed = (now - lastCreatedAt) / 1000;

  if (elapsed < limitSeconds) {
    return {
      limited: true,
      retryAfter: Math.ceil(limitSeconds - elapsed),
    };
  }

  return { limited: false };
}

/**
 * Set-Cookie ヘルパー（新規 Cookie の場合）
 */
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function setCookieHeaders(
  cookieUuid: string,
  isNewCookie: boolean
): Record<string, string> {
  if (!isNewCookie) return {};

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    "Set-Cookie": `${COOKIE_NAME}=${cookieUuid}; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}; Path=/${secure}`,
  };
}
