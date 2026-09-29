"use client";

import React, { useState, useEffect } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import {
  Search, SlidersHorizontal, Heart, ChevronDown, ChevronRight, Check
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());


type GarmentItem = {
  id: string;
  brand: string;
  title: string;
  category: string;
  imageUrl: string;
  postedAt: string;
  condition: string;
  size: string;
};

const CATEGORIES = ["All", "Outerwear", "T-Shirts", "Knitwear", "Denim", "Bottoms", "Shirts"];
const CONDITIONS = ["Brand New", "Like New", "Pre-Owned", "Archival", "Heavily Worn"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "OS"];
const SORT_OPTIONS = ["Newest Drops", "Highest Demand", "Nearest"];

type ArchiveFeedProps = {
  /** Server-side category filter; also hides the sub-category chips. */
  category?: string;
  title: string;
  blurb: string;
};

export function ArchiveFeed({ category, title, blurb }: ArchiveFeedProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const inFlight = React.useRef<Set<string>>(new Set());

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS[0]);
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);

  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  const getKey = (pageIndex: number, prev: { meta?: { nextCursor?: string | null } } | null) => {
    if (prev && !prev.meta?.nextCursor) return null;
    const cursor = pageIndex > 0 && prev?.meta?.nextCursor ? `${qs ? '&' : '?'}cursor=${prev.meta.nextCursor}` : '';
    return `/api/items${qs}${cursor}`;
  };
  const { data: pages, size, setSize, isLoading: loading } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    dedupingInterval: 30_000,
  });
  const garments: GarmentItem[] = (pages ?? []).flatMap((p) => p?.data ?? []);
  const hasMore = (pages ?? []).length > 0 && pages![pages!.length - 1]?.meta?.hasMore;

  useEffect(() => {
    fetch('/api/saved')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSavedIds(new Set(json.data.map((s: { itemId: string }) => s.itemId)));
      })
      .catch(() => {});
  }, []);

  const toggleSave = async (id: string) => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);

    const wasSaved = savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (wasSaved) {
        await fetch(`/api/saved?itemId=${id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: id }),
        });
      }
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    } finally {
      inFlight.current.delete(id);
    }
  };

  const displayedGarments = category || activeCategory === "All"
    ? garments
    : garments.filter((item) => item.category === activeCategory);

  return (
    <div className={`min-h-full bg-background text-foreground selection:bg-foreground selection:text-background`}>

      <main className="max-w-[1800px] mx-auto px-6 py-10">

        <div className="mb-12">
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] uppercase text-fg-subtle mb-6">
            <span className="hover:text-foreground cursor-pointer transition-colors">Archives</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{title}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-3">
            {title}
          </h1>
          <p className="text-xs text-fg-muted max-w-2xl font-medium tracking-wide">
            {blurb}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-y border-foreground/10 py-4 relative z-40">

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0 flex-grow">

            <div className="relative shrink-0">
              <button
                onClick={() => setIsAllFiltersOpen(!isAllFiltersOpen)}
                className={`flex items-center gap-2 px-5 py-2.5 transition-all group border ${
                  isAllFiltersOpen
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent border-foreground/20 hover:border-foreground text-foreground'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">All Filters</span>
                <SlidersHorizontal className={`w-3.5 h-3.5 transition-colors ${isAllFiltersOpen ? 'text-background' : 'text-fg-muted group-hover:text-foreground'}`} />
              </button>

              {isAllFiltersOpen && (
                <div className="absolute top-full left-0 mt-4 w-[600px] max-w-[85vw] bg-background border border-foreground/10 shadow-2xl z-50 p-8">
                  <div className="grid grid-cols-3 gap-8">

                    <div>
                      <h4 className="text-[9px] font-black text-fg-subtle uppercase tracking-widest mb-4 border-b border-foreground/10 pb-2">Category</h4>
                      <div className="flex flex-col gap-2">
                        {CATEGORIES.filter(c => c !== "All").map(cat => (
                          <label key={cat} className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveCategory(cat)}>
                            <div className="w-3 h-3 border border-foreground/30 group-hover:border-foreground transition-colors flex items-center justify-center">
                              {activeCategory === cat && <Check className="w-2.5 h-2.5 text-foreground" strokeWidth={4} />}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-fg-muted group-hover:text-foreground transition-colors">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[9px] font-black text-fg-subtle uppercase tracking-widest mb-4 border-b border-foreground/10 pb-2">Condition</h4>
                      <div className="flex flex-col gap-2">
                        {CONDITIONS.map(cond => (
                          <label key={cond} className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-3 h-3 border border-foreground/30 group-hover:border-foreground transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-fg-muted group-hover:text-foreground transition-colors">{cond}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[9px] font-black text-fg-subtle uppercase tracking-widest mb-4 border-b border-foreground/10 pb-2">Size</h4>
                      <div className="flex flex-wrap gap-2">
                        {SIZES.map(size => (
                          <button key={size} className="w-10 h-10 flex items-center justify-center border border-foreground/10 text-[9px] font-bold uppercase tracking-widest text-fg-muted hover:border-foreground hover:text-foreground transition-all">
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  <div className="mt-8 pt-4 border-t border-foreground/10 flex justify-end gap-4">
                    <button
                      onClick={() => { setActiveCategory("All"); setIsAllFiltersOpen(false); }}
                      className="text-[9px] font-black uppercase tracking-widest text-fg-subtle hover:text-foreground transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setIsAllFiltersOpen(false)}
                      className="bg-foreground text-background px-6 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-foreground/80 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!category && <div className="flex items-center gap-2 ml-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 text-[9px] font-black tracking-widest uppercase transition-all border shrink-0 ${
                    activeCategory === cat
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-fg-muted border-transparent hover:border-foreground/20 hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>}
          </div>

          <div
            className="relative shrink-0 border-l border-foreground/10 pl-6 ml-auto"
            onMouseEnter={() => setIsSortOpen(true)}
            onMouseLeave={() => setIsSortOpen(false)}
          >
            <div className="flex items-center gap-2 py-2 cursor-pointer">
              <span className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle">Sort by:</span>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors">
                {activeSort}
                <ChevronDown className={`w-3 h-3 text-fg-subtle transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {isSortOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-foreground/10 shadow-2xl z-50">
                <div className="flex flex-col">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setActiveSort(option);
                        setIsSortOpen(false);
                      }}
                      className={`text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest border-b border-foreground/5 transition-colors ${
                        activeSort === option
                          ? 'bg-surface-2 text-foreground'
                          : 'bg-transparent text-fg-muted hover:bg-surface-2 hover:text-foreground'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="w-full aspect-[3/4] bg-card border border-foreground/5 animate-pulse" />
                <div className="mt-4 h-3 w-20 bg-surface-3 animate-pulse" />
                <div className="mt-2 h-4 w-full bg-surface-3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {displayedGarments.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col cursor-pointer"
                onMouseEnter={() => router.prefetch(`/list-stuffs/show/${item.id}`)}
                onClick={() => router.push(`/list-stuffs/show/${item.id}`)}
              >

                <div className="relative w-full aspect-[3/4] bg-card mb-4 border border-foreground/5 overflow-hidden">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4="
                    />
                  )}

                  <button
                    onClick={() => toggleSave(item.id)}
                    className="absolute top-4 right-4 bg-background/50 backdrop-blur-md p-2 border border-transparent hover:border-foreground/20 hover:bg-background transition-all group/btn"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${savedIds.has(item.id) ? 'text-foreground fill-foreground' : 'text-fg-muted group-hover/btn:text-foreground group-hover/btn:fill-foreground'}`} />
                  </button>

                  <div className="absolute bottom-4 left-4 bg-background border border-foreground/10 px-2 py-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Size {item.size || '—'}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-fg-muted">
                      {item.brand || '—'}
                    </h3>
                  </div>

                  <p className="text-sm font-bold text-foreground mb-2 leading-tight group-hover:underline decoration-1 underline-offset-4">
                    {item.title}
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-fg-subtle border border-foreground/10 px-1.5 py-0.5">
                      {item.condition}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-fg-faint">
                      Drop • {item.postedAt}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setSize(size + 1)}
              className="border border-foreground/20 px-10 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
            >
              Load More
            </button>
          </div>
        )}

        {!loading && displayedGarments.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center border border-foreground/10 border-dashed">
            <Search className="w-8 h-8 text-fg-faint mb-4" />
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-2">No Archives Found</h3>
            <p className="text-[10px] text-fg-subtle uppercase tracking-widest">Adjust your filters to see more pieces.</p>
            <button
              onClick={() => setActiveCategory("All")}
              className="mt-6 border border-foreground/20 px-6 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}

      </main>
    </div>
  );
}