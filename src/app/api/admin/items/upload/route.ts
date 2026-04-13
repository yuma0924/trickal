import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "../../_middleware";
import sharp from "sharp";

const BUCKET_NAME = "item-icons";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const RESIZE_SIZE = 128;

/**
 * アイテム画像アップロード API
 * POST /api/admin/items/upload
 * FormData: { file: File, itemId: string }
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const itemId = formData.get("itemId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: "アイテムIDが指定されていません" },
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

    const filePath = `${itemId}.webp`;

    // 128x128 WebP にリサイズ
    const arrayBuffer = await file.arrayBuffer();
    const resized = await sharp(Buffer.from(arrayBuffer))
      .resize(RESIZE_SIZE, RESIZE_SIZE, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, resized, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    // アイテムの image_url を更新
    const { error: updateError } = await supabase
      .from("items")
      .update({
        image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);

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
