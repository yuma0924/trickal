export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-40 rounded-lg bg-bg-tertiary" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-9 rounded-[10px] bg-bg-tertiary" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-bg-tertiary" />
        ))}
      </div>
    </div>
  );
}
