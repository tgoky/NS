"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal, Hash, CornerDownRight,
  Eye, EyeOff, Crown, Ticket, Fingerprint, Lock, X
} from "lucide-react";


type WishItem = {
  id: string;
  type: 'request' | 'brand_raffle';
  brand?: string;
  user?: string;
  request: string;
  category: string;
  bounty: string;
  urgency: 'high' | 'normal' | 'low';
  span: string;
  timestamp: string;
  isAnon: boolean;
  entrants?: number;
};

type DrawerMode = "brand_portal" | "list_brand" | "";

export default function WhatStuffPage() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [activeTab, setActiveTab] = useState("community");
  const [transmitting, setTransmitting] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/wishes')
      .then((r) => r.json())
      .then((json) => { if (json.success) setWishes(json.data); })
      .catch(() => {});
  }, []);

  const openDrawer = (mode: DrawerMode) => {
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setDrawerMode(""), 300);
  };

  const handleTransmit = async () => {
    if (!inputText.trim() || transmitting) return;
    setTransmitting(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: inputText.trim(),
          isAnon,
          bounty: 'OPEN TRADE',
          urgency: 'normal',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setWishes((prev) => [json.data, ...prev]);
        setInputText("");
        if (textareaRef.current) textareaRef.current.focus();
      }
    } finally {
      setTransmitting(false);
    }
  };

  const displayedWishes = wishes.filter((item) =>
    activeTab === "community" ? true :
    activeTab === "catalogue" ? item.type === "brand_raffle" :
    false
  );

  return (
    <div className={`min-h-full bg-background text-foreground selection:bg-brand selection:text-black pb-32 relative overflow-x-hidden`}>

      <div className="max-w-[1500px] mx-auto px-4 md:px-6 pt-12 pb-6">

        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none mb-4">
              WhatStuff?
            </h1>
            <p className="text-[10px] md:text-[11px] text-fg-subtle font-bold uppercase tracking-[0.25em] max-w-2xl leading-relaxed">
              A thought community and decentralized wishlist. WhatStuff helps you get an idea of what clothes are in trend, what people are talking about, or actively requesting. Broadcast your desires, track your curated catalogue, or apply for official brand PR allocations.
            </p>
          </div>

          <div className="flex flex-row gap-4 shrink-0 mt-6 md:mt-0">
            <button
              onClick={() => openDrawer('brand_portal')}
              className="flex flex-col justify-between items-start bg-brand text-black p-4 md:p-5 hover:bg-brand/85 transition-colors w-[140px] h-[140px] md:w-[150px] md:h-[150px] text-left outline-none rounded-sm shadow-[0_0_15px_rgba(0,255,178,0.1)] hover:shadow-[0_0_20px_rgba(0,255,178,0.3)]"
            >
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] leading-tight">Brand Portal</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-background/70 leading-snug">Access PR<br/>Allocations</span>
            </button>
            <button
              onClick={() => openDrawer('list_brand')}
              className="flex flex-col justify-between items-start bg-[#FF4E00] text-foreground p-4 md:p-5 hover:bg-[#E64600] transition-colors w-[140px] h-[140px] md:w-[150px] md:h-[150px] text-left outline-none rounded-sm shadow-[0_0_15px_rgba(255,78,0,0.1)] hover:shadow-[0_0_20px_rgba(255,78,0,0.3)]"
            >
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] leading-tight">List Your<br/>Brand</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/80 leading-snug">Set Up Promos<br/>& Free Merch</span>
            </button>
          </div>
        </div>

        <div className="inline-flex items-center bg-card border border-foreground/10 p-1 mb-8 rounded-sm">
          {[
            { id: "community", label: "Global Feed" },
            { id: "catalogue", label: "Brand Catalogue" },
            { id: "tracker", label: "My Tracker" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[9px] font-black tracking-[0.2em] uppercase px-6 py-3 transition-all outline-none rounded-sm bg-blck ${
                activeTab === tab.id
                  ? "bg-background text-foreground border border-foreground/10 shadow-sm"
                  : "text-fg-faint hover:text-fg-soft border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-px bg-foreground/10 border border-foreground/10 p-px">

          {/* BROADCASTER MODULE */}
          <div className="bg-card md:col-span-2 md:row-span-1 p-5 relative group flex flex-col justify-between min-h-[180px]">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex-grow flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-ink">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Initialize Request</span>
                </div>

                <button
                  onClick={() => setIsAnon(!isAnon)}
                  className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-2 py-1 border transition-colors ${
                    isAnon
                      ? "border-foreground/40 text-fg-muted bg-surface-2/50"
                      : "border-brand-ink/30 text-brand-ink bg-brand/5"
                  }`}
                >
                  {isAnon ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {isAnon ? "Ghost Mode" : "Public Mode"}
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="WHAT DO YOU DESIRE?"
                className="w-full bg-transparent text-lg md:text-xl font-bold tracking-tight text-foreground placeholder:text-fg-ghost resize-none outline-none flex-grow"
              />
            </div>

            <div className="relative z-10 flex items-center justify-between mt-2 border-t border-foreground/5 pt-4">
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-background border border-foreground/10 text-[9px] font-black uppercase tracking-[0.2em] text-fg-subtle hover:text-foreground hover:border-foreground/30 transition-colors">
                  + Tag
                </button>
                <button className="px-3 py-1.5 bg-background border border-foreground/10 text-[9px] font-black uppercase tracking-[0.2em] text-fg-subtle hover:text-brand-ink hover:border-brand-ink/30 transition-colors">
                  + Reward
                </button>
              </div>

              <button
                onClick={handleTransmit}
                disabled={!inputText.trim() || transmitting}
                className={`border px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 outline-none ${
                  inputText.trim() && !transmitting
                    ? 'bg-background border-brand-ink/30 text-brand-ink hover:bg-brand/10 group-focus-within:border-brand-ink group-focus-within:shadow-[0_0_10px_rgba(0,255,178,0.2)]'
                    : 'bg-background border-foreground/10 text-fg-faint cursor-not-allowed'
                }`}
              >
                {transmitting ? 'Transmitting...' : 'Transmit'}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"/>
                  <rect x="0" y="6" width="3" height="4" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          {/* DYNAMIC FEED ITEMS */}
          {displayedWishes.map((item) => {
            const isBrand = item.type === "brand_raffle";

            return (
              <div
                key={item.id}
                className={`p-5 transition-all flex flex-col justify-between relative group cursor-crosshair ${item.span} min-h-[180px] ${
                  isBrand ? "bg-foreground/85 text-background hover:bg-foreground" : "bg-background text-foreground hover:bg-card"
                }`}
              >
                {isBrand && (
                  <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-16px] right-[-16px] w-8 h-8 rotate-45 bg-background" />
                  </div>
                )}
                {!isBrand && item.urgency === 'high' && (
                  <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-16px] right-[-16px] w-8 h-8 rotate-45 bg-[#FF4E00]" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[9px] font-black tracking-[0.2em] uppercase flex items-center gap-1.5 ${
                      isBrand ? "text-fg-faint" : item.isAnon ? "text-fg-subtle" : "text-fg-muted"
                    }`}>
                      {isBrand ? <Crown className="w-3 h-3 text-background" /> : item.isAnon ? <Fingerprint className="w-3 h-3" /> : null}
                      {isBrand ? item.brand : item.user}
                    </span>
                    <span className={`text-[8px] font-bold tracking-widest uppercase ${
                      isBrand ? "text-background" : "text-fg-faint"
                    }`}>
                      {item.timestamp}
                    </span>
                  </div>

                  <h3 className={`${item.span.includes('row-span-2') ? 'text-xl md:text-2xl' : 'text-sm md:text-base'} font-bold tracking-tight leading-snug ${
                    isBrand ? "text-background" : "text-fg-soft group-hover:text-foreground"
                  } transition-colors`}>
                    &quot;{item.request}&quot;
                  </h3>
                </div>

                <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${
                  isBrand ? "border-background/10" : "border-foreground/5"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${
                      isBrand ? "text-background" : "text-brand-ink"
                    }`}>
                      <Hash className="w-2.5 h-2.5" /> {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBrand && item.entrants && (
                      <span className="text-[8px] font-bold tracking-widest text-fg-subtle mr-2 border-r border-background/20 pr-2">
                        {item.entrants} APPLIED
                      </span>
                    )}
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border rounded-sm ${
                      isBrand ? 'text-background border-background/30 bg-background/5' :
                      item.bounty.includes('TRADE') ? 'text-brand-ink border-brand-ink/20 bg-brand/5' :
                      'text-foreground border-foreground/10 bg-foreground/5'
                    }`}>
                      {item.bounty}
                    </span>
                  </div>
                </div>

                {isBrand ? (
                  <button className="absolute inset-0 flex items-center justify-center bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm z-20">
                    <span className="text-foreground text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-foreground/20 px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
                      <Ticket className="w-4 h-4" /> Apply for Allocation
                    </span>
                  </button>
                ) : (
                  <button className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-card border border-foreground/10 text-foreground p-2 rounded-sm hover:bg-foreground hover:text-background">
                    <CornerDownRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {activeTab === "tracker" && (
            <div className="md:col-span-3 xl:col-span-5 bg-card min-h-[300px] flex flex-col items-center justify-center p-10 border border-foreground/5 border-dashed">
              <Lock className="w-8 h-8 text-fg-ghost mb-4" strokeWidth={1} />
              <h3 className="text-sm font-black uppercase tracking-widest text-fg-muted mb-2">No Active Tracks</h3>
              <p className="text-[10px] text-fg-faint uppercase tracking-widest max-w-sm text-center">
                You have not requested any items or entered any PR waitlists. Broadcast a desire to begin tracking.
              </p>
            </div>
          )}

        </div>
      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-opacity"
          onClick={closeDrawer}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-[450px] bg-background border-l border-foreground/10 z-[101] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-card shrink-0">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-foreground" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
              {drawerMode === "brand_portal" ? "SYS.BRAND_PORTAL" : "SYS.BRAND_ONBOARDING"}
            </h2>
          </div>
          <button onClick={closeDrawer} className="p-2 text-fg-subtle hover:text-foreground hover:bg-foreground/5 transition-colors outline-none bg-transparent border-none rounded-sm">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
          {drawerMode === "brand_portal" ? (
            <>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Portal Access</h3>
                <p className="text-[10px] text-fg-subtle uppercase tracking-widest leading-relaxed">
                  Enter your authorized brand key to access the curated drop environment, manage allocations, and view analytics.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[8px] font-black text-fg-subtle uppercase tracking-[0.2em] block mb-2">Brand Name / ID</label>
                  <input type="text" placeholder="e.g. BALENCIAGA_HQ" className="w-full bg-card border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-foreground transition-colors" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-fg-subtle uppercase tracking-[0.2em] block mb-2">Authorization Key</label>
                  <input type="password" placeholder="••••••••••••" className="w-full bg-card border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-foreground transition-colors" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Initialize Brand</h3>
                <p className="text-[10px] text-fg-subtle uppercase tracking-widest leading-relaxed">
                  Submit an application to onboard your brand. Setup promotional campaigns, drop free merch, and access trend analytics.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[8px] font-black text-fg-subtle uppercase tracking-[0.2em] block mb-2">Official Brand Name</label>
                  <input type="text" placeholder="ENTER NAME" className="w-full bg-card border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-foreground transition-colors" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-fg-subtle uppercase tracking-[0.2em] block mb-2">Primary Contact Node (Email)</label>
                  <input type="email" placeholder="contact@brand.com" className="w-full bg-card border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-foreground transition-colors" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-fg-subtle uppercase tracking-[0.2em] block mb-2">Campaign Type</label>
                  <select className="w-full bg-card border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-foreground transition-colors uppercase tracking-widest">
                    <option>Free Merch Allocation</option>
                    <option>Exclusive Listing Drop</option>
                    <option>Community Promo</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-foreground/10 bg-card mt-auto shrink-0">
          <button className="w-full py-4 bg-foreground text-background hover:bg-foreground/80 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center outline-none rounded-sm">
            TRANSMIT
          </button>
        </div>
      </div>

    </div>
  );
}