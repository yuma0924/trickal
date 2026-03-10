import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理ダッシュボード | トリッカルランキング",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Header/Footer を非表示にするため、ルートレイアウトの <main> の中身だけ差し替え
  return <>{children}</>;
}
