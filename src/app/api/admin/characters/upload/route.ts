import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "../../_middleware";

const BUCKET_NAME = "character-icons";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * キャラアイコン画像アップロード API
 * POST /api/admin/characters/upload
 * FormData: { file: File, characterId: string }
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

    // ファイル名: characterId + 拡張子
    const ext = file.name.split(".").pop() || "png";
    const filePath = `${characterId}.${ext}`;

    // アップロード（上書き可）
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    // キャラクターの image_url を更新
    const { error: updateError } = await supabase
      .from("characters")
      .update({
        image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch {
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
