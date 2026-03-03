import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";

const COOKIE_NAME = "trickal_uid";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1年（秒）

/**
 * user_hash を生成して返す API
 * Cookie UUID + IP + server_secret の SHA-256 ハッシュ
 *
 * GET /api/user-hash
 * Response: { user_hash: string }
 */
export async function GET(request: NextRequest) {
  const serverSecret = process.env.USER_HASH_SECRET;
  if (!serverSecret) {
    console.error("USER_HASH_SECRET is not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Cookie から UUID を取得、なければ新規生成
  let cookieUuid = request.cookies.get(COOKIE_NAME)?.value;
  const isNewCookie = !cookieUuid;

  if (!cookieUuid) {
    cookieUuid = randomUUID();
  }

  // クライアント IP を取得
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") ?? "unknown";

  // SHA-256 ハッシュ生成
  const userHash = createHash("sha256")
    .update(`${cookieUuid}${clientIp}${serverSecret}`)
    .digest("hex");

  const response = NextResponse.json({ user_hash: userHash });

  // 新規 Cookie の場合のみ Set-Cookie
  if (isNewCookie) {
    response.cookies.set(COOKIE_NAME, cookieUuid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return response;
}
