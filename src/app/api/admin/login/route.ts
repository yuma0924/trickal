import { NextResponse } from "next/server";
import {
  createAdminToken,
  ADMIN_TOKEN_COOKIE,
} from "@/app/admin/_lib/auth";

/**
 * 管理者ログイン API
 * POST /api/admin/login
 * Body: { password: string }
 * 成功時: JWT を httpOnly Cookie にセットして返す
 */
export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: string };

    if (!password) {
      return NextResponse.json(
        { error: "パスワードが入力されていません" },
        { status: 400 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable is not set");
      return NextResponse.json(
        { error: "サーバー設定エラー" },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "パスワードが正しくありません" },
        { status: 401 }
      );
    }

    const token = await createAdminToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24時間
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
