/**
 * Supabase Storageからアイテム・愛用カード画像をダウンロードしてpublic/に配置
 * DB のimage_urlをローカルパスに更新
 *
 * npx tsx scripts/download-item-images.ts
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const PUBLIC_DIR = join(process.cwd(), "public");

async function downloadBucket(bucketName: string, localDir: string) {
  console.log(`\n=== ${bucketName} → ${localDir} ===`);
  mkdirSync(join(PUBLIC_DIR, localDir), { recursive: true });

  const { data: files, error } = await supabase.storage.from(bucketName).list("", { limit: 500 });
  if (error || !files) {
    console.error("Failed to list:", error?.message);
    return [];
  }

  const results: { fileName: string; localPath: string }[] = [];

  for (const file of files) {
    if (file.name.startsWith(".")) continue;

    const { data: blob, error: dlError } = await supabase.storage.from(bucketName).download(file.name);
    if (dlError || !blob) {
      console.error(`  ❌ ${file.name}: ${dlError?.message}`);
      continue;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const localFilePath = join(PUBLIC_DIR, localDir, file.name);
    writeFileSync(localFilePath, buffer);

    const localUrl = `/${localDir}/${file.name}`;
    results.push({ fileName: file.name, localPath: localUrl });
    console.log(`  ✅ ${file.name} (${(buffer.length / 1024).toFixed(1)}KB)`);
  }

  return results;
}

async function main() {
  console.log("Downloading images from Supabase Storage to public/...\n");

  // アイテム画像
  const itemResults = await downloadBucket("item-icons", "items");

  // DBのimage_urlを更新
  for (const { fileName, localPath } of itemResults) {
    const id = fileName.replace(/\.[^.]+$/, "");
    const { error } = await supabase
      .from("items")
      .update({ image_url: localPath, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error(`  DB update failed for ${id}: ${error.message}`);
  }
  console.log(`\nItems: ${itemResults.length} files, DB updated`);

  // 愛用カード画像
  const relicResults = await downloadBucket("relic-icons", "relics");

  // metadataのrelic.image_urlを更新
  for (const { fileName, localPath } of relicResults) {
    const id = fileName.replace(/\.[^.]+$/, "");
    const { data: char } = await supabase.from("characters").select("metadata").eq("id", id).single();
    if (char?.metadata) {
      const meta = char.metadata as Record<string, unknown>;
      const relic = meta.relic as Record<string, unknown> | undefined;
      if (relic) {
        relic.image_url = localPath;
        await supabase.from("characters").update({ metadata: meta }).eq("id", id);
      }
    }
  }
  console.log(`Relics: ${relicResults.length} files, DB updated`);

  console.log("\n✅ All done! Images are now in public/ and DB URLs updated.");
}

main().catch(console.error);
