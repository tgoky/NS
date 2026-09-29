export default function GarmentsLoading() {
  return (
    <div className="min-h-full bg-background">
      <main className="max-w-[1800px] mx-auto px-6 py-10">
        <div className="mb-12">
          <div className="h-3 w-24 bg-surface-3 animate-pulse mb-6" />
          <div className="h-12 w-64 bg-surface-3 animate-pulse mb-3" />
          <div className="h-4 w-96 bg-surface-3 animate-pulse" />
        </div>
        <div className="h-14 w-full bg-surface-2 animate-pulse mb-8 border border-foreground/5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="w-full aspect-[3/4] bg-card border border-foreground/5 animate-pulse" />
              <div className="mt-4 h-3 w-20 bg-surface-3 animate-pulse" />
              <div className="mt-2 h-4 w-full bg-surface-3 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}