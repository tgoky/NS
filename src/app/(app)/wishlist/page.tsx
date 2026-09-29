"use client";

import React, { useState, useEffect } from "react";
import Image from 'next/image';
import {
  Zap, Handshake, Hand, X, Check, ArrowLeftRight, Bookmark
} from "lucide-react";


type SavedItem = {
  id: string;
  itemId: string;
  user: string;
  brand: string;
  title: string;
  imageUrl: string;
  savedAt: string;
  status: 'available' | 'pending' | 'unavailable';
  type: 'request' | 'swap';
  seeking: string;
};

type InventoryItem = {
  id: string;
  title: string;
  imageUrl: string;
};

export default function WishlistPage() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [myInventory, setMyInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"request" | "swap">("request");
  const [targetItem, setTargetItem] = useState<SavedItem | null>(null);
  const [selectedOwnItem, setSelectedOwnItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSaved = fetch('/api/saved')
      .then((r) => r.json())
      .then((json) => { if (json.success) setSavedItems(json.data); });

    const fetchInventory = fetch('/api/items?mine=true')
      .then((r) => r.json())
      .then((json) => { if (json.success) setMyInventory(json.data); });

    Promise.all([fetchSaved, fetchInventory]).finally(() => setLoading(false));
  }, []);

  const openDrawer = (item: SavedItem, mode: "request" | "swap") => {
    setTargetItem(item);
    setDrawerMode(mode);
    setSelectedOwnItem(null);
    setSubmitted(false);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setTargetItem(null), 300);
  };

  const handleRemove = async (itemId: string, id: string) => {
    await fetch(`/api/saved?itemId=${itemId}`, { method: 'DELETE' });
    setSavedItems((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async () => {
    if (!targetItem || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: targetItem.itemId,
          message: selectedOwnItem ? `Swap offer: item ${selectedOwnItem}` : undefined,
        }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
        setTimeout(closeDrawer, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = activeTab === "all"
    ? savedItems
    : activeTab === "available"
      ? savedItems.filter((item) => item.status === "available" || item.status === "pending")
      : savedItems.filter((item) => item.status === "unavailable");

  return (
    <div className={`min-h-full bg-background text-foreground selection:bg-foreground selection:text-background pb-32`}>

      <div className="max-w-[1200px] mx-auto px-6 pt-6 flex flex-col gap-4">

        <div className="flex flex-col border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <Bookmark className="w-5 h-5 text-fg-subtle fill-background" strokeWidth={1.5} />
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
              Saved Archives
            </h1>
            <span className="bg-foreground/10 text-foreground px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-sm ml-2">
              {loading ? '—' : savedItems.length} Items
            </span>
          </div>
          <p className="text-[10px] text-fg-subtle font-bold uppercase tracking-widest max-w-xl">
            Your personal hit-list. Track items you are hunting and execute swaps when the time is right.
          </p>
        </div>

        <div className="flex items-center gap-8 border-b border-foreground/5 pb-0">
          {["all", "available", "unavailable"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors relative pb-2.5 outline-none ${
                activeTab === tab ? "text-foreground" : "text-fg-faint hover:text-fg-soft"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-px bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col divide-y divide-foreground/5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-5 py-3.5 px-3">
                <div className="w-14 aspect-[4/5] bg-surface-3 animate-pulse rounded-sm" />
                <div className="flex flex-col gap-2 flex-grow">
                  <div className="h-3 w-16 bg-surface-3 animate-pulse" />
                  <div className="h-4 w-48 bg-surface-3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-foreground/5">
            {filteredItems.map((item) => {
              const isUnavailable = item.status === "unavailable";
              const isPending = item.status === "pending";

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col md:flex-row md:items-center gap-5 py-3.5 transition-colors hover:bg-foreground/5 px-3 -mx-3 rounded-sm ${
                    isUnavailable ? "opacity-50 grayscale hover:grayscale-0" : ""
                  }`}
                >
                  <div className="relative w-14 aspect-[4/5] shrink-0 bg-card border border-foreground/10 overflow-hidden rounded-sm">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="56px"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4="
                      />
                    )}
                  </div>

                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[9px] font-black tracking-widest uppercase text-fg-subtle truncate">
                        {item.brand || '—'}
                      </h3>
                      {isPending && <span className="text-[8px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-1.5 py-px border border-yellow-500/20 rounded-sm">Pending</span>}
                      {isUnavailable && <span className="text-[8px] font-black uppercase tracking-widest text-fg-subtle border border-foreground/20 px-1.5 py-px rounded-sm">Unavailable</span>}
                    </div>

                    <p className="text-xs font-bold text-foreground uppercase leading-tight truncate">
                      {item.title}
                    </p>

                    {item.seeking && (
                      <p className="text-[9px] text-fg-muted font-medium truncate mt-0.5">
                        <span className="font-bold text-fg-faint uppercase tracking-widest">Seeking:</span> {item.seeking}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 text-[8px] font-bold tracking-widest uppercase text-fg-faint">
                      <span>Saved {item.savedAt}</span>
                      <span>•</span>
                      <span>@{item.user}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 mt-3 md:mt-0">
                    {isUnavailable ? (
                      <button disabled className="px-4 py-2 border border-foreground/15 text-fg-faint text-[9px] font-black uppercase tracking-widest cursor-not-allowed rounded-sm">
                        Locked
                      </button>
                    ) : item.type === "swap" ? (
                      <button
                        onClick={() => openDrawer(item, "swap")}
                        className="px-4 py-2 border border-foreground/20 text-foreground text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors rounded-sm flex items-center gap-1.5 outline-none"
                      >
                        <Handshake className="w-3.5 h-3.5" strokeWidth={1.5} /> Swap
                      </button>
                    ) : (
                      <button
                        onClick={() => openDrawer(item, "request")}
                        className="px-4 py-2 border border-foreground/20 text-foreground text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors rounded-sm flex items-center gap-1.5 outline-none"
                      >
                        <Hand className="w-3.5 h-3.5 -rotate-12" strokeWidth={1.5} /> Request
                      </button>
                    )}

                    <button
                      onClick={() => handleRemove(item.itemId, item.id)}
                      className="w-8 h-8 flex items-center justify-center text-fg-faint hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-sm outline-none"
                      title="Remove from Wishlist"
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center border border-foreground/5 border-dashed mt-4 rounded-sm">
            <Bookmark className="w-6 h-6 text-fg-ghost mb-3" strokeWidth={1.5} />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-fg-subtle mb-1.5">Wishlist is Empty</h3>
            <p className="text-[9px] text-fg-faint uppercase tracking-widest">You have not saved any items to this list yet.</p>
          </div>
        )}

      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
          onClick={closeDrawer}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-[450px] bg-background border-l border-foreground/10 z-[101] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-background shrink-0">
          <div className="flex items-center gap-3">
            {drawerMode === "swap" && <Handshake className="w-5 h-5 text-foreground" strokeWidth={1.5} />}
            {drawerMode === "request" && <Hand className="w-5 h-5 text-foreground -rotate-12" strokeWidth={1.5} />}
            <h2 className="text-lg font-black uppercase tracking-tighter">
              {drawerMode === "swap" ? "Propose Swap" : "Request Item"}
            </h2>
          </div>
          <button onClick={closeDrawer} className="p-2 text-fg-subtle hover:text-foreground hover:bg-foreground/5 transition-colors outline-none bg-transparent border-none rounded-md">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {targetItem && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">

            <div>
              <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-3">
                {drawerMode === "swap" ? "You are proposing a trade for" : "You are requesting"}
              </span>
              <div className="flex gap-4 p-4 border border-foreground/10 bg-card rounded-md">
                {targetItem.imageUrl && (
                  <div className="relative w-16 h-16 shrink-0 border border-foreground/5 rounded-sm overflow-hidden">
                    <Image src={targetItem.imageUrl} alt="Item" fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-foreground uppercase leading-tight mb-1">
                    {targetItem.title}
                  </span>
                  {targetItem.seeking && (
                    <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest">
                      Seeking: {targetItem.seeking}
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest mt-1">
                    Owned by @{targetItem.user}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-foreground/10 flex items-center justify-center bg-background text-fg-subtle">
                {drawerMode === "swap" ? <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle">
                  {drawerMode === "swap" ? "Select item to offer" : "Offer an item in exchange (Optional)"}
                </span>
                <button className="text-[9px] font-bold uppercase tracking-widest text-fg-muted hover:text-foreground border-b border-foreground/30 hover:border-foreground transition-colors bg-transparent outline-none">
                  Upload New +
                </button>
              </div>

              {myInventory.length === 0 ? (
                <p className="text-[10px] text-fg-faint uppercase tracking-widest text-center py-8 border border-foreground/5 border-dashed">
                  You have no items in your archive yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {myInventory.map((myObj) => {
                    const isSelected = selectedOwnItem === myObj.id;
                    return (
                      <div
                        key={myObj.id}
                        onClick={() => setSelectedOwnItem(myObj.id)}
                        className={`relative cursor-pointer group border rounded-md transition-all ${isSelected ? 'border-foreground bg-foreground/5' : 'border-foreground/10 hover:border-foreground/40 bg-background'}`}
                      >
                        <div className="relative w-full aspect-square overflow-hidden border-b border-foreground/5 rounded-t-md">
                          {myObj.imageUrl && (
                            <Image src={myObj.imageUrl} alt={myObj.title} fill sizes="160px" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-fg-soft line-clamp-2 leading-snug">{myObj.title}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-foreground text-background p-1 rounded-sm">
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        <div className="p-6 border-t border-foreground/10 bg-background mt-auto shrink-0">
          <button
            onClick={handleSubmit}
            disabled={(drawerMode === "swap" && !selectedOwnItem) || submitting || submitted}
            className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 outline-none rounded-md ${
              submitted
                ? 'bg-brand text-black cursor-default'
                : (drawerMode === "request" || selectedOwnItem)
                  ? 'bg-foreground text-background hover:bg-foreground/80 cursor-pointer'
                  : 'bg-surface-2 text-fg-faint cursor-not-allowed border-none'
            }`}
          >
            {submitted
              ? 'Request Sent ✓'
              : submitting
                ? 'Sending...'
                : drawerMode === "swap"
                  ? (selectedOwnItem ? 'Send Proposal' : 'Select an Item First')
                  : (selectedOwnItem ? 'Request & Offer Swap' : 'Request for Free')}
          </button>
        </div>

      </div>
    </div>
  );
}