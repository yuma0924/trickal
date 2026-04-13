import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl font-bold text-text-muted">404</p>
      <h1 className="mt-4 text-lg font-bold text-text-primary">
        ページが見つかりません
      </h1>
      <Link
        href="/admin"
        className="mt-6 inline-flex rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
      >
        管理画面に戻る
      </Link>
    </div>
  );
}
