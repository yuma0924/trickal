"use client";

import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Client Component 用 Supabase クライアント
 * anon key を使用し、RLS が適用される
 */
export function createBrowserClient() {
  return _createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
