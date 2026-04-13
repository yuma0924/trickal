/**
 * Supabase Storageからキャラアイコンをダウンロードしてpublic/characters/に配置
 * PNG→WebP変換（解像度維持、画質90）
 * DBのimage_urlをローカルパスに更新
 *
 * npx tsx scripts/download-character-icons.ts
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const OUTPUT_DIR = join(process.cwd(), "public", "characters");

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const { data: files, error } = await supabase.storage.from("character-icons").list("", { limit: 500 });
  if (error || !files) {
    console.error("Failed to list:", error?.message);
    return;
  }

  console.log(`Found ${files.length} character icons\n`);

  let converted = 0;
  let failed = 0;

  for (const file of files) {
    if (file.name.startsWith(".")) continue;

    try {
      const { data: blob, error: dlError } = await supabase.storage
        .from("character-icons")
        .download(file.name);

      if (dlError || !blob) {
        console.error(`  ❌ ${file.name}: ${dlError?.message}`);
        failed++;
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      const id = file.name.replace(/\.[^.]+$/, "");

      // WebP変換（解像度維持、画質90で画質劣化なし）
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 90 })
        .toBuffer();

      const outPath = join(OUTPUT_DIR, `${id}.webp`);
      writeFileSync(outPath, webpBuffer);

      // DB更新
      const localUrl = `/characters/${id}.webp`;
      const { error: updateError } = await supabase
        .from("characters")
        .update({ image_url: localUrl })
        .eq("id", id);

      if (updateError) {
        console.error(`  ⚠️  DB update failed for ${id}: ${updateError.message}`);
      }

      const reduction = Math.round((1 - webpBuffer.length / buffer.length) * 100);
      console.log(`  ✅ ${file.name} → ${id}.webp (${(buffer.length / 1024).toFixed(1)}KB → ${(webpBuffer.length / 1024).toFixed(1)}KB, -${reduction}%)`);
      converted++;
    } catch (err) {
      console.error(`  ❌ ${file.name}:`, err);
      failed++;
    }
  }

  console.log(`\n✅ Done: ${converted} converted, ${failed} failed`);
}

main().catch(console.error);
