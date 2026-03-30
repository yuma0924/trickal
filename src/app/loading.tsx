export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* ヒーローセクション */}
      <div className="space-y-3">
        <div className="h-6 w-48 rounded-lg bg-bg-tertiary" />
        <div className="h-4 w-64 rounded bg-bg-tertiary" />
        <div className="h-48 rounded-2xl bg-bg-tertiary" />
      </div>
      {/* カードグリッド */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-bg-tertiary" />
        ))}
      </div>
    </div>
  );
}
