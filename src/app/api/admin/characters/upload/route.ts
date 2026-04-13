import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "../../_middleware";
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BUCKET_NAME = "character-icons";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * キャラアイコン画像アップロード API
 * POST /api/admin/characters/upload
 * FormData: { file: File, characterId: string }
 *
 * 1. WebP変換（解像度維持、画質90）
 * 2. Supabase Storageにバックアップ保存
 * 3. public/characters/にローカル保存（Vercel CDN配信用）
 * 4. DBのimage_urlをローカルパスで更新
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const characterId = formData.get("characterId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    if (!characterId) {
      return NextResponse.json(
        { error: "キャラクターIDが指定されていません" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "PNG, JPEG, WebP のみアップロード可能です" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは2MB以下にしてください" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // WebP変換（解像度維持、画質90）
    const arrayBuffer = await file.arrayBuffer();
    const webpBuffer = await sharp(Buffer.from(arrayBuffer))
      .webp({ quality: 90 })
      .toBuffer();

    const filePath = `${characterId}.webp`;

    // Supabase Storageにバックアップ保存
    await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    // public/characters/にローカル保存
    try {
      const publicDir = join(process.cwd(), "public", "characters");
      mkdirSync(publicDir, { recursive: true });
      writeFileSync(join(publicDir, filePath), webpBuffer);
    } catch {
      // Vercel上ではファイルシステム書き込み不可（スクリプトで対応）
    }

    // DBのimage_urlをローカルパスで更新
    const localUrl = `/characters/${filePath}`;
    const { error: updateError } = await supabase
      .from("characters")
      .update({
        image_url: localUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: localUrl });
  } catch {
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
