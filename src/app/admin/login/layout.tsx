export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ログインページはルートレイアウトのヘッダー等を隠して全画面表示
  return <div className="fixed inset-0 z-50 bg-bg-primary">{children}</div>;
}
