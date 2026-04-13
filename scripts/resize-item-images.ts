/**
 * 既存のアイテム画像・愛用カード画像を128x128 WebPにリサイズして再アップロード
 *
 * 使い方: npx tsx scripts/resize-item-images.ts
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESIZE_SIZE = 128;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function resizeBucket(bucketName: string, updateTable?: { table: string; column: string; idColumn: string }) {
  console.log(`\n=== ${bucketName} ===`);

  const { data: files, error } = await supabase.storage.from(bucketName).list("", { limit: 500 });
  if (error) {
    console.error(`Failed to list ${bucketName}:`, error.message);
    return;
  }

  if (!files || files.length === 0) {
    console.log("No files found");
    return;
  }

  let resized = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    if (file.name.startsWith(".")) continue;

    try {
      // ダウンロード
      const { data: blob, error: dlError } = await supabase.storage
        .from(bucketName)
        .download(file.name);

      if (dlError || !blob) {
        console.error(`  ❌ Download failed: ${file.name} - ${dlError?.message}`);
        failed++;
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      const metadata = await sharp(buffer).metadata();

      // 既に小さい場合はスキップ
      if (metadata.width && metadata.width <= RESIZE_SIZE && metadata.height && metadata.height <= RESIZE_SIZE && metadata.format === "webp") {
        console.log(`  ⏭️  Already optimized: ${file.name} (${metadata.width}x${metadata.height})`);
        skipped++;
        continue;
      }

      const originalSize = buffer.length;

      // リサイズ
      const resizedBuffer = await sharp(buffer)
        .resize(RESIZE_SIZE, RESIZE_SIZE, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      // IDを抽出（ファイル名から拡張子を除去）
      const id = file.name.replace(/\.[^.]+$/, "");
      const newFileName = `${id}.webp`;

      // アップロード（上書き）
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(newFileName, resizedBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        console.error(`  ❌ Upload failed: ${file.name} - ${uploadError.message}`);
        failed++;
        continue;
      }

      // 古いファイルが別名なら削除
      if (file.name !== newFileName) {
        await supabase.storage.from(bucketName).remove([file.name]);
      }

      // DBのURLを更新
      if (updateTable) {
        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(newFileName);
        await supabase
          .from(updateTable.table)
          .update({ [updateTable.column]: publicUrl })
          .eq(updateTable.idColumn, id);
      }

      const reduction = Math.round((1 - resizedBuffer.length / originalSize) * 100);
      console.log(`  ✅ ${file.name} → ${newFileName} (${(originalSize / 1024).toFixed(1)}KB → ${(resizedBuffer.length / 1024).toFixed(1)}KB, -${reduction}%)`);
      resized++;
    } catch (err) {
      console.error(`  ❌ Error: ${file.name} -`, err);
      failed++;
    }
  }

  console.log(`\nDone: ${resized} resized, ${skipped} skipped, ${failed} failed`);
}

async function resizeRelicImages() {
  console.log("\n=== relic-icons (metadata update) ===");

  const { data: files } = await supabase.storage.from("relic-icons").list("", { limit: 500 });
  if (!files || files.length === 0) {
    console.log("No files found");
    return;
  }

  let resized = 0;

  for (const file of files) {
    if (file.name.startsWith(".")) continue;

    try {
      const { data: blob } = await supabase.storage.from("relic-icons").download(file.name);
      if (!blob) continue;

      const buffer = Buffer.from(await blob.arrayBuffer());
      const metadata = await sharp(buffer).metadata();

      if (metadata.width && metadata.width <= RESIZE_SIZE && metadata.height && metadata.height <= RESIZE_SIZE && metadata.format === "webp") {
        console.log(`  ⏭️  Already optimized: ${file.name}`);
        continue;
      }

      const resizedBuffer = await sharp(buffer)
        .resize(RESIZE_SIZE, RESIZE_SIZE, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      const id = file.name.replace(/\.[^.]+$/, "");
      const newFileName = `${id}.webp`;

      await supabase.storage.from("relic-icons").upload(newFileName, resizedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

      if (file.name !== newFileName) {
        await supabase.storage.from("relic-icons").remove([file.name]);
      }

      // metadataのrelic.image_urlを更新
      const { data: { publicUrl } } = supabase.storage.from("relic-icons").getPublicUrl(newFileName);
      const { data: char } = await supabase
        .from("characters")
        .select("metadata")
        .eq("id", id)
        .single();

      if (char?.metadata) {
        const meta = char.metadata as Record<string, unknown>;
        const relic = meta.relic as Record<string, unknown> | undefined;
        if (relic) {
          relic.image_url = publicUrl;
          await supabase.from("characters").update({ metadata: meta }).eq("id", id);
        }
      }

      console.log(`  ✅ ${file.name} → ${newFileName} (${(buffer.length / 1024).toFixed(1)}KB → ${(resizedBuffer.length / 1024).toFixed(1)}KB)`);
      resized++;
    } catch (err) {
      console.error(`  ❌ Error: ${file.name} -`, err);
    }
  }

  console.log(`Done: ${resized} resized`);
}

async function main() {
  console.log("Resizing item images to 128x128 WebP...\n");

  // アイテム画像（大好物・報酬）
  await resizeBucket("item-icons", {
    table: "items",
    column: "image_url",
    idColumn: "id",
  });

  // 愛用カード画像
  await resizeRelicImages();

  console.log("\n✅ All done!");
}

main().catch(console.error);
