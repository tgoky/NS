export default function WhatStuffLoading() {
  return (
    <div className="min-h-full bg-background">
      <div className="max-w-[900px] mx-auto px-6 py-10 flex flex-col gap-6">
        <div className="h-12 w-64 bg-surface-3 animate-pulse" />
        <div className="h-32 w-full bg-surface-2 animate-pulse border border-foreground/5" />
        <div className="flex flex-col gap-4 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-foreground/5 p-4 animate-pulse">
              <div className="h-4 w-3/4 bg-surface-3 mb-2" />
              <div className="h-3 w-24 bg-surface-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}