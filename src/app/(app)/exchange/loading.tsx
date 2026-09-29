export default function ExchangeLoading() {
  return (
    <div className="min-h-full bg-background">
      <main className="max-w-[1800px] mx-auto px-6 py-10">
        <div className="mb-12 flex justify-between items-end border-b border-foreground/10 pb-8">
          <div>
            <div className="h-12 w-72 bg-surface-3 animate-pulse mb-4" />
            <div className="h-4 w-96 bg-surface-3 animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-surface-3 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-card border border-foreground/10 h-64 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}