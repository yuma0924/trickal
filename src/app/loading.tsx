export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-[14px] bg-bg-card" />
        <div className="h-5 w-48 rounded bg-bg-card" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl border border-border-primary bg-bg-card"
          />
        ))}
      </div>
    </div>
  );
}
