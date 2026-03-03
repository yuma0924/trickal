import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken, ADMIN_TOKEN_COOKIE } from "../_lib/auth";
import { Sidebar } from "../_components/sidebar";
import { MobileNav } from "../_components/mobile-nav";

export default async function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    redirect("/admin/login");
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-bg-primary">
      {/* PC: サイドバー */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* モバイル: ヘッダー + ナビ */}
        <MobileNav />

        {/* コンテンツエリア */}
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
