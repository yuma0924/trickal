import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminToken,
  ADMIN_TOKEN_COOKIE,
} from "@/app/admin/_lib/auth";

/**
 * 管理者 API Route 用の認証ガード
 * 各 API Route handler 内で呼び出して使用する
 *
 * @returns null の場合は認証失敗のレスポンスを返す
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "認証が無効または期限切れです" },
      { status: 401 }
    );
  }

  return null; // 認証成功
}
