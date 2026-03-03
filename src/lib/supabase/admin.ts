import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * API Route 用 Supabase クライアント (service_role key)
 * RLS をバイパスし、全テーブルへの読み書きが可能
 * サーバーサイド (API Route) でのみ使用すること
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
