export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-4">
        <div className="h-24 w-24 shrink-0 rounded-[10px] bg-bg-tertiary md:h-56 md:w-56 md:rounded-[16px]" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-32 rounded-lg bg-bg-tertiary" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-14 rounded bg-bg-tertiary" />
            ))}
          </div>
          <div className="h-4 w-24 rounded bg-bg-tertiary" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-20 rounded bg-bg-tertiary" />
        <div className="h-32 rounded-2xl bg-bg-tertiary" />
      </div>
    </div>
  );
}
