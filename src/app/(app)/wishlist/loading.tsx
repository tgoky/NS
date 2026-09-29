export default function WishlistLoading() {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-[1200px] mx-auto px-6 pt-6 flex flex-col gap-4">
        <div className="h-12 w-64 bg-surface-3 animate-pulse mb-2" />
        <div className="flex flex-col divide-y divide-foreground/5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-5 py-3.5 px-3">
              <div className="w-14 aspect-[4/5] bg-surface-3 animate-pulse rounded-sm" />
              <div className="flex flex-col gap-2 flex-grow">
                <div className="h-3 w-16 bg-surface-3 animate-pulse" />
                <div className="h-4 w-48 bg-surface-3 animate-pulse" />
                <div className="h-3 w-24 bg-surface-3 animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-surface-3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}