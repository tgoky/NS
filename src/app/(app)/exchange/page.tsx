"use client";

import React, { useState, useEffect } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search, SlidersHorizontal, ArrowLeftRight, X, Check, Package
} from "lucide-react";


type BarterItem = {
  id: string;
  user: string;
  offeringTitle: string;
  offeringImage: string;
  seeking: string;
};

type InventoryItem = {
  id: string;
  title: string;
  imageUrl: string;
};

export default function ExchangePage() {
  const router = useRouter();
  const [barterFeed, setBarterFeed] = useState<BarterItem[]>([]);
  const [myInventory, setMyInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBarterItem, setSelectedBarterItem] = useState<BarterItem | null>(null);
  const [selectedOwnItem, setSelectedOwnItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchFeed = fetch('/api/items?isExchange=true')
      .then((r) => r.json())
      .then((json) => { if (json.success) setBarterFeed(json.data); });

    const fetchInventory = fetch('/api/items?mine=true')
      .then((r) => r.json())
      .then((json) => { if (json.success) setMyInventory(json.data); });

    Promise.all([fetchFeed, fetchInventory]).finally(() => setLoading(false));
  }, []);

  const openSwapDrawer = (item: BarterItem) => {
    setSelectedBarterItem(item);
    setSelectedOwnItem(null);
    setSubmitted(false);
    setIsDrawerOpen(true);
  };

  const closeSwapDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedBarterItem(null), 300);
  };

  const sendProposal = async () => {
    if (!selectedBarterItem || !selectedOwnItem || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedBarterItem.id,
          message: `Swap proposal: offering item ${selectedOwnItem}`,
        }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
        setTimeout(closeSwapDrawer, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-full bg-background text-foreground selection:bg-foreground selection:text-background`}>

      <main className="max-w-[1800px] mx-auto px-6 py-10">

        <div className="mb-12 flex justify-between items-end border-b border-foreground/10 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ArrowLeftRight className="w-8 h-8 text-foreground" strokeWidth={1.5} />
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
                Open Exchange
              </h1>
            </div>
            <p className="text-xs text-fg-muted font-bold uppercase tracking-widest max-w-xl leading-relaxed">
              Trade pieces from your archive directly with the community. Find what you seek, offer what you have. No currency involved.
            </p>
          </div>

          <button
            onClick={() => router.push('/exchange/create')}
            className="bg-foreground text-background px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-foreground/80 transition-colors border border-foreground flex items-center gap-2"
          >
            <Package className="w-3.5 h-3.5" /> Post an Exchange
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle" />
              <input
                type="text"
                placeholder="Search offerings or requests..."
                className="w-full bg-background border border-foreground/10 text-foreground text-[10px] font-bold uppercase tracking-widest px-10 py-3 focus:outline-none focus:border-foreground/40 transition-colors placeholder:text-fg-faint"
              />
            </div>
            <button className="flex items-center gap-2 bg-transparent border border-foreground/10 px-5 py-3 hover:border-foreground transition-all group">
              <SlidersHorizontal className="w-3.5 h-3.5 text-fg-muted group-hover:text-foreground transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-muted group-hover:text-foreground">Filters</span>
            </button>
          </div>

          <div className="text-[9px] font-bold uppercase tracking-widest text-fg-subtle">
            {loading ? 'Loading...' : `Showing ${barterFeed.length} Active Exchanges`}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-foreground/10 h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {barterFeed.map((barter) => (
              <div
                key={barter.id}
                className="group flex flex-col bg-card border border-foreground/10 hover:border-foreground/40 transition-colors"
                onMouseEnter={() => router.prefetch(`/list-stuffs/show/${barter.id}`)}
              >

                <div className="relative w-full h-40 overflow-hidden bg-background border-b border-foreground/10">
                  <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-md px-2 py-1 text-[8px] font-black tracking-widest uppercase text-foreground border border-foreground/10">
                    Offering
                  </div>
                  {barter.offeringImage && (
                    <Image
                      src={barter.offeringImage}
                      alt={barter.offeringTitle}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4="
                    />
                  )}
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xs font-bold text-foreground leading-tight uppercase mb-4 line-clamp-2">
                    {barter.offeringTitle}
                  </h3>

                  <div className="bg-background border border-foreground/5 p-3 mb-4 mt-auto">
                    <span className="block text-[8px] font-black text-fg-subtle uppercase tracking-widest mb-1.5">
                      Seeking
                    </span>
                    <p className="text-[10px] text-fg-soft font-medium line-clamp-2">
                      {barter.seeking || '—'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-foreground/10 mt-auto">
                    <span className="text-[9px] font-bold text-fg-faint">@{barter.user}</span>

                    <button
                      onClick={() => openSwapDrawer(barter)}
                      className="bg-background border border-foreground/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors flex items-center gap-1.5"
                    >
                      Swap <ArrowLeftRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {!loading && barterFeed.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center border border-foreground/10 border-dashed">
            <ArrowLeftRight className="w-8 h-8 text-fg-faint mb-4" strokeWidth={1} />
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-2">No Active Exchanges</h3>
            <p className="text-[10px] text-fg-subtle uppercase tracking-widest">Be the first to post an exchange offering.</p>
          </div>
        )}

      </main>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
          onClick={closeSwapDrawer}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-[450px] bg-background border-l border-foreground/10 z-[101] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-background">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-black uppercase tracking-tighter">Propose Swap</h2>
          </div>
          <button
            onClick={closeSwapDrawer}
            className="p-2 text-fg-subtle hover:text-foreground hover:bg-foreground/5 transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedBarterItem && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">

            <div>
              <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-3">
                You are requesting from @{selectedBarterItem.user}
              </span>
              <div className="flex gap-4 p-4 border border-foreground/10 bg-card">
                {selectedBarterItem.offeringImage && (
                  <div className="relative w-16 h-16 shrink-0 border border-foreground/5">
                    <Image src={selectedBarterItem.offeringImage} alt="Item" fill sizes="64px" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-foreground uppercase leading-tight mb-1">{selectedBarterItem.offeringTitle}</span>
                  <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest">Seeking: {selectedBarterItem.seeking || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-foreground/10 flex items-center justify-center bg-background text-fg-subtle">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle">
                  Select item to offer from your archive
                </span>
                <button className="text-[9px] font-bold uppercase tracking-widest text-fg-muted hover:text-foreground border-b border-foreground/30 hover:border-foreground transition-colors">
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
                        className={`relative cursor-pointer group border transition-all ${
                          isSelected
                            ? 'border-foreground bg-foreground/5'
                            : 'border-foreground/10 hover:border-foreground/40 bg-background'
                        }`}
                      >
                        <div className="relative w-full aspect-square overflow-hidden border-b border-foreground/5">
                          {myObj.imageUrl && (
                            <Image src={myObj.imageUrl} alt={myObj.title} fill sizes="160px" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-fg-soft line-clamp-2 leading-snug">
                            {myObj.title}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-foreground text-background p-1">
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

        <div className="p-6 border-t border-foreground/10 bg-background mt-auto">
          <button
            onClick={sendProposal}
            disabled={!selectedOwnItem || submitting || submitted}
            className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
              submitted
                ? 'bg-brand text-black cursor-default'
                : selectedOwnItem
                  ? 'bg-foreground text-background hover:bg-foreground/80 cursor-pointer'
                  : 'bg-surface-2 text-fg-faint cursor-not-allowed'
            }`}
          >
            {submitted ? 'Proposal Sent ✓' : submitting ? 'Sending...' : selectedOwnItem ? 'Send Proposal' : 'Select an Item First'}
          </button>
        </div>

      </div>
    </div>
  );
}