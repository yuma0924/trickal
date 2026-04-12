import { cookies, headers } from "next/headers";
import { createHash } from "crypto";

const COOKIE_NAME = "trickal_uid";

/**
 * Server Component から user_hash を取得する
 * Cookie が存在しない場合は null を返す（新規ユーザーはいいね状態なし）
 */
export async function getServerUserHash(): Promise<string | null> {
  const serverSecret = process.env.USER_HASH_SECRET;
  if (!serverSecret) return null;

  const cookieStore = await cookies();
  const cookieUuid = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieUuid) return null;

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const clientIp = forwarded
    ? forwarded.split(",")[0].trim()
    : headerStore.get("x-real-ip") ?? "unknown";

  return createHash("sha256")
    .update(`${cookieUuid}${clientIp}${serverSecret}`)
    .digest("hex");
}
