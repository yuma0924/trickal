"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl font-bold text-text-muted">Error</p>
      <h1 className="mt-4 text-lg font-bold text-text-primary">
        管理画面でエラーが発生しました
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        しばらく時間をおいてから再度お試しください。
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex cursor-pointer rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
      >
        再試行
      </button>
    </div>
  );
}
