import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-text-muted">404</p>
      <h1 className="mt-4 text-lg font-bold text-text-primary">
        ページが見つかりません
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        お探しのページは移動または削除された可能性があります。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
      >
        ホームへ戻る
      </Link>
    </div>
  );
}
