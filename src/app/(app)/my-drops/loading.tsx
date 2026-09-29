export default function MyDropsLoading() {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-[1400px] mx-auto px-6 pt-4 pb-12 flex flex-col gap-6">
        <div className="h-16 w-full bg-surface-2 animate-pulse border-b border-foreground/10" />
        <div className="grid grid-cols-3 gap-px bg-foreground/10 border border-foreground/10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card p-5">
              <div className="h-3 w-20 bg-surface-3 animate-pulse mb-2" />
              <div className="h-8 w-12 bg-surface-3 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex flex-col divide-y divide-foreground/5 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 py-5 px-4">
              <div className="w-24 h-4 bg-surface-3 animate-pulse" />
              <div className="flex-grow flex items-center gap-4">
                <div className="w-14 h-14 bg-surface-3 animate-pulse rounded-sm" />
                <div className="flex flex-col gap-2">
                  <div className="w-16 h-3 bg-surface-3 animate-pulse" />
                  <div className="w-40 h-4 bg-surface-3 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}