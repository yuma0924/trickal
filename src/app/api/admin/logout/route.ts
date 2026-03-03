import { NextResponse } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/app/admin/_lib/auth";

/**
 * 管理者ログアウト API
 * POST /api/admin/logout
 * Cookie を削除して認証を解除する
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
