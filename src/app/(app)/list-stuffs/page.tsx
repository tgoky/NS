"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  SlidersHorizontal,
  ArrowLeftRight,
  Gift,
  PackageOpen,
  Heart,
  Users,
  ChevronDown,
  X,
} from "lucide-react";


const CATEGORIES = ["All", "Clothing", "Shoes", "Accessories", "Equipment", "Kitchen", "Other"];
const CONDITIONS = [
  { value: "", label: "Any Condition" },
  { value: "NEW", label: "Brand New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Pre-Owned" },
  { value: "FAIR", label: "Archival" },
];

type Item = {
  id: string;
  title: string;
  brand: string;
  category: string;
  imageUrl: string;
  condition: string;
  size: string;
  postedAt: string;
  status: string;
  queueCount: number;
  user: string;
  isExchange: boolean;
  seeking: string;
};

export default function ListStuffsPage() {
  const router = useRouter();
  const searchQuery = useSearchParams().get("q")?.trim() ?? "";

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState<"all" | "free" | "exchange">("all");
  const [activeCondition, setActiveCondition] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const buildUrl = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.set("category", activeCategory);
      if (activeType === "exchange") params.set("isExchange", "true");
      if (activeCondition) params.set("condition", activeCondition);
      if (searchQuery) params.set("q", searchQuery);
      if (cursor) params.set("cursor", cursor);
      return `/api/items?${params.toString()}`;
    },
    [activeCategory, activeType, activeCondition, searchQuery]
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setNextCursor(null);
    try {
      const res = await fetch(buildUrl());
      const json = await res.json();
      if (json.success) {
        const data: Item[] = json.data;
        const filtered =
          activeType === "free" ? data.filter((i) => !i.isExchange) : data;
        setItems(filtered);
        setHasMore(json.meta?.hasMore ?? false);
        setNextCursor(json.meta?.nextCursor ?? null);
      }
    } catch {
      // silence fetch errors
    } finally {
      setLoading(false);
    }
  }, [buildUrl, activeType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when the filters change
    fetchItems();
  }, [fetchItems]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(nextCursor));
      const json = await res.json();
      if (json.success) {
        const data: Item[] = json.data;
        const filtered =
          activeType === "free" ? data.filter((i) => !i.isExchange) : data;
        setItems((prev) => [...prev, ...filtered]);
        setHasMore(json.meta?.hasMore ?? false);
        setNextCursor(json.meta?.nextCursor ?? null);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setActiveCategory("All");
    setActiveType("all");
    setActiveCondition("");
    if (searchQuery) router.replace("/list-stuffs");
  };

  const hasActiveFilters =
    activeCategory !== "All" || activeType !== "all" || activeCondition !== "" || searchQuery !== "";

  return (
    <div
      className={`min-h-full bg-background text-foreground selection:bg-brand selection:text-black pb-32`}
    >
      <div className="max-w-[1400px] mx-auto px-6 pt-6 flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-end border-b border-foreground/[0.08] pb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-fg-faint mb-2">Community Ledger</p>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
                List Stuffs
              </h1>
            </div>
            <p className="text-[10px] text-fg-faint font-bold uppercase tracking-widest max-w-xl">
              Browse available items · Claim free drops · Propose a swap
            </p>
          </div>

          <button
            onClick={() => router.push("/list-stuffs/create")}
            className="bg-brand text-black px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand/90 transition-all flex items-center gap-2 shrink-0 active:scale-[0.98] shadow-[0_0_30px_rgba(0,255,178,0.15)]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> List Your Stuff
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-4">

          {/* Type toggle */}
          <div className="flex items-center gap-1 flex-wrap bg-card border border-foreground/10 p-1 w-fit">
            {(["all", "free", "exchange"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex items-center gap-2 px-5 py-2.5 text-[9px] font-black tracking-[0.2em] uppercase transition-all outline-none ${
                  activeType === type
                    ? "bg-surface-3 text-foreground border-none shadow-sm"
                    : "text-fg-faint hover:text-fg-soft bg-transparent"
                }`}
              >
                {type === "free" && <Gift className="w-3 h-3" strokeWidth={2} />}
                {type === "exchange" && <ArrowLeftRight className="w-3 h-3" strokeWidth={2} />}
                {type === "all" ? "All" : type === "free" ? "Free" : "Exchange"}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 text-[9px] font-black tracking-[0.2em] uppercase transition-colors outline-none px-4 py-2.5 border ${
                showFilters || hasActiveFilters
                  ? "text-brand-ink border-brand-ink/30 bg-brand/5"
                  : "text-fg-subtle border-foreground/10 hover:text-foreground hover:border-foreground/30 bg-card"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
              Filters
              {hasActiveFilters && (
                <span className="w-4 h-4 bg-brand text-black text-[8px] font-black flex items-center justify-center">
                  {[activeCategory !== "All", activeType !== "all", activeCondition !== ""].filter(Boolean).length}
                </span>
              )}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`}
                strokeWidth={2.5}
              />
            </button>
          </div>

          {/* Expandable filter panel */}
          {showFilters && (
            <div className="p-5 bg-background border border-foreground/[0.07] flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200">

              {/* Category */}
              <div>
                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-fg-faint mb-3">
                  Category
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all border outline-none ${
                        activeCategory === cat
                          ? "bg-surface-3 text-foreground border-foreground/30"
                          : "bg-transparent text-fg-faint border-foreground/[0.07] hover:text-fg-soft hover:border-foreground/20"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-fg-faint mb-3">
                  Condition
                </span>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond.value}
                      onClick={() => setActiveCondition(cond.value)}
                      className={`px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all border outline-none ${
                        activeCondition === cond.value
                          ? "bg-surface-3 text-foreground border-foreground/30"
                          : "bg-transparent text-fg-faint border-foreground/[0.07] hover:text-fg-soft hover:border-foreground/20"
                      }`}
                    >
                      {cond.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="self-start flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-fg-subtle hover:text-foreground transition-colors outline-none border-b border-foreground/20 hover:border-foreground pb-0.5"
                >
                  <X className="w-3 h-3" strokeWidth={2.5} /> Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-card border border-foreground/5 rounded-sm overflow-hidden animate-pulse">
                <div className="w-full aspect-[4/5] bg-surface-2" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-2.5 w-16 bg-surface-3 rounded" />
                  <div className="h-4 w-3/4 bg-surface-3 rounded" />
                  <div className="h-3 w-1/2 bg-surface-3 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center border border-foreground/5 border-dashed rounded-sm mt-4">
            <PackageOpen className="w-10 h-10 text-fg-ghost mb-4" strokeWidth={1} />
            <h3 className="text-xs font-black uppercase tracking-widest text-fg-subtle mb-2">
              Nothing Here Yet
            </h3>
            <p className="text-[10px] text-fg-faint uppercase tracking-widest mb-6">
              {hasActiveFilters
                ? "No items match the current filters."
                : "Be the first to list something."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="text-[9px] font-black uppercase tracking-widest text-foreground border border-foreground/20 px-5 py-2.5 hover:bg-foreground hover:text-background transition-colors outline-none rounded-sm"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => router.push("/list-stuffs/create")}
                className="text-[9px] font-black uppercase tracking-widest text-black bg-brand px-5 py-2.5 hover:bg-brand/90 transition-colors outline-none rounded-sm flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> List Something
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/list-stuffs/show/${item.id}`)}
                  className="group flex flex-col bg-background border border-foreground/10 hover:border-foreground/40 transition-all duration-300 cursor-pointer rounded-sm overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[4/5] bg-card overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PackageOpen className="w-8 h-8 text-fg-ghost" strokeWidth={1} />
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {item.isExchange ? (
                        <span className="bg-background/80 backdrop-blur-md px-2 py-1 text-[8px] font-black tracking-widest uppercase text-brand-ink border border-brand-ink/30 flex items-center gap-1">
                          <ArrowLeftRight className="w-2.5 h-2.5" strokeWidth={2} /> Exchange
                        </span>
                      ) : (
                        <span className="bg-background/80 backdrop-blur-md px-2 py-1 text-[8px] font-black tracking-widest uppercase text-foreground border border-foreground/10 flex items-center gap-1">
                          <Gift className="w-2.5 h-2.5" strokeWidth={2} /> Free
                        </span>
                      )}
                    </div>

                    {/* Queue badge */}
                    {item.queueCount > 0 && (
                      <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2 py-1 text-[8px] font-black tracking-widest uppercase text-fg-muted border border-foreground/10 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" strokeWidth={2} />
                        {item.queueCount}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-grow">
                    {item.brand && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-fg-subtle mb-1 truncate">
                        {item.brand}
                      </span>
                    )}
                    <p className="text-[12px] font-bold text-foreground uppercase leading-snug line-clamp-2 mb-2">
                      {item.title}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-foreground/5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-fg-faint">
                          @{item.user}
                        </span>
                        {item.condition && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-fg-ghost">
                            {item.condition}
                            {item.size ? ` · Sz ${item.size}` : ""}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="text-fg-faint hover:text-foreground transition-colors outline-none bg-transparent border-none p-0 flex items-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Exchange seeking label */}
                    {item.isExchange && item.seeking && (
                      <div className="mt-3 pt-3 border-t border-foreground/5">
                        <span className="block text-[7px] font-black uppercase tracking-widest text-fg-faint mb-0.5">
                          Seeking
                        </span>
                        <p className="text-[9px] font-bold text-fg-muted line-clamp-1 uppercase">
                          {item.seeking}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={`px-10 py-4 text-[10px] font-black uppercase tracking-widest transition-all border outline-none rounded-sm ${
                    loadingMore
                      ? "bg-card text-fg-faint border-foreground/10 cursor-not-allowed"
                      : "bg-background text-foreground border-foreground/20 hover:bg-foreground hover:text-background"
                  }`}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}