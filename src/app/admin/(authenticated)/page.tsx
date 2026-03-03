import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

type StatsCard = {
  label: string;
  value: number;
  href: string;
  description: string;
};

async function getDashboardStats(): Promise<StatsCard[]> {
  const supabase = createAdminClient();

  const [characters, pendingReports, blacklist, recentComments] =
    await Promise.all([
      supabase
        .from("characters")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("blacklist")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("is_deleted", false),
    ]);

  return [
    {
      label: "キャラクター",
      value: characters.count ?? 0,
      href: "/admin/characters",
      description: "登録済みキャラ数",
    },
    {
      label: "未対応の通報",
      value: pendingReports.count ?? 0,
      href: "/admin/reports",
      description: "対応が必要な通報",
    },
    {
      label: "BAN ユーザー",
      value: blacklist.count ?? 0,
      href: "/admin/blacklist",
      description: "ブラックリスト登録数",
    },
    {
      label: "コメント",
      value: recentComments.count ?? 0,
      href: "/admin/comments",
      description: "全コメント数（削除済み除く）",
    },
  ];
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text-primary">ダッシュボード</h1>
        <p className="mt-1 text-sm text-text-secondary">
          サイトの概要と管理機能への導線
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-border-primary bg-bg-card p-4 transition-colors hover:border-accent/30 hover:bg-bg-card-hover"
          >
            <p className="text-xs text-text-tertiary">{stat.description}</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">
              {stat.value.toLocaleString()}
            </p>
            <p className="mt-0.5 text-sm font-medium text-text-secondary">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      {/* クイックアクション */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-text-secondary">
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/characters"
            className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-card px-4 py-3 text-sm text-text-primary transition-colors hover:border-accent/30 hover:bg-bg-card-hover"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            キャラデータを編集
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-card px-4 py-3 text-sm text-text-primary transition-colors hover:border-accent/30 hover:bg-bg-card-hover"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-thumbs-down/10 text-thumbs-down">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
              </svg>
            </span>
            通報を確認
          </Link>
          <Link
            href="/admin/comments"
            className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-card px-4 py-3 text-sm text-text-primary transition-colors hover:border-accent/30 hover:bg-bg-card-hover"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
            コメントを管理
          </Link>
        </div>
      </div>
    </div>
  );
}
