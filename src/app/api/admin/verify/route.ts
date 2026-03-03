import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminToken,
  ADMIN_TOKEN_COOKIE,
} from "@/app/admin/_lib/auth";

/**
 * 管理者トークン検証 API
 * GET /api/admin/verify
 * Cookie の JWT を検証し、認証状態を返す
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
