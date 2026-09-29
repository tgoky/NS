"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus, MapPin, Zap, SlidersHorizontal,
  Hand, Handshake, ArrowLeftRight, Tag, Heart, User, DollarSign, ChevronLeft, ChevronRight, X, Check, MessageSquare, PackageOpen, ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/time";


type FeedItem = {
  id: string;
  user: string;
  brand: string;
  title: string;
  imageUrl: string;
  postedAt: string;
  status: string;
  queueCount: number;
  isExchange: boolean;
  seeking: string;
  offeringTitle: string;
  offeringImage: string;
};

type ContactInfo = {
  receiverPhone: string;
  receiverEmail: string;
  receiverAddress: string;
};

// ─── Step 2: Contact info form ─────────────────────────────────────────────────
function ContactStep({
  onBack,
  onSubmit,
  submitting,
}: {
  onBack: () => void;
  onSubmit: (info: ContactInfo) => void;
  submitting: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const isValid = phone.trim() && email.trim() && address.trim();

  const inputCls = "w-full bg-card border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-foreground/40 transition-colors placeholder:text-fg-faint";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-fg-subtle hover:text-foreground transition-colors bg-transparent outline-none border-none mb-4"
        >
          ← Back
        </button>
        <p className="text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-1">Step 2 of 2</p>
        <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Your Delivery Details</h3>
        <p className="text-[10px] text-fg-subtle font-bold uppercase tracking-widest mt-1 leading-relaxed">
          Only shared with the giver after they accept your request.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">Phone Number</label>
          <input type="tel" placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">Email Address</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">Delivery Address</label>
          <textarea
            rows={3}
            placeholder="Full address the giver or rider should deliver to"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      <p className="text-[8px] text-fg-faint font-bold uppercase tracking-widest leading-relaxed border border-foreground/5 p-3 bg-foreground/[0.02]">
        🔒 Hidden from the public. Only revealed to the giver once they accept your request.
      </p>

      <button
        onClick={() => onSubmit({ receiverPhone: phone.trim(), receiverEmail: email.trim(), receiverAddress: address.trim() })}
        disabled={!isValid || submitting}
        className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 outline-none ${
          !isValid || submitting
            ? "bg-surface-2 text-fg-faint cursor-not-allowed"
            : "bg-foreground text-background hover:bg-brand hover:text-black cursor-pointer"
        } hover:text-black`}
      >
        {submitting ? "Sending..." : "Confirm & Send Request"}
        {!submitting && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function MarketplaceHome() {
  const router = useRouter();
  const [activeGender, setActiveGender] = useState("unisex");
  const [liveFeed, setLiveFeed] = useState<FeedItem[]>([]);
  const [exchangeFeed, setExchangeFeed] = useState<FeedItem[]>([]);
  const [pulseEvents, setPulseEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"request" | "swap" | "activity">("request");
  // Step: "intent" = pick item/confirm intent, "contact" = fill delivery details
  const [drawerStep, setDrawerStep] = useState<"intent" | "contact">("intent");
  const [targetItem, setTargetItem] = useState<any>(null);
  const [selectedOwnItem, setSelectedOwnItem] = useState<string | null>(null);
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [itemActivity, setItemActivity] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const feedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/items').then(r => r.json()),
      fetch('/api/items?mine=true').then(r => r.json()),
      fetch('/api/activity').then(r => r.json()),
    ]).then(([allJson, mineJson, activityJson]) => {
      if (allJson.success) {
        const all: FeedItem[] = allJson.data;
        setLiveFeed(all.filter(i => !i.isExchange));
        setExchangeFeed(all.filter(i => i.isExchange));
      }
      if (mineJson.success) {
        setMyInventory(mineJson.data.slice(0, 6).map((i: FeedItem) => ({
          id: i.id, title: i.title, imageUrl: i.imageUrl,
        })));
      }
      if (activityJson?.success) setPulseEvents(activityJson.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const scrollFeed = (direction: 'left' | 'right') => {
    if (feedScrollRef.current?.firstElementChild) {
      const scrollAmount = (feedScrollRef.current.firstElementChild as HTMLElement).clientWidth + 16;
      feedScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Step 1 → 2
  const handleProceedToContact = () => {
    if (drawerMode === "swap" && !selectedOwnItem) return;
    setDrawerStep("contact");
  };

  // Step 2: final submit with contact info
  const handleRequest = async (contactInfo: ContactInfo) => {
    if (!targetItem || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: targetItem.id,
          message: selectedOwnItem ? `Swap proposal: offering item ${selectedOwnItem}` : "Requesting for free",
          receiverPhone: contactInfo.receiverPhone,
          receiverEmail: contactInfo.receiverEmail,
          receiverAddress: contactInfo.receiverAddress,
        }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
        setTimeout(() => { closeDrawer(); setSubmitted(false); }, 1500);
      } else {
        const json = await res.json();
        alert(json.error?.message || "Request failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || isPostingComment || !targetItem) return;
    setIsPostingComment(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetItem.id, text: commentText }),
      });
      const json = await res.json();
      if (json.success) {
        setItemActivity((prev: any) => ({ ...prev, comments: [json.data, ...(prev?.comments || [])] }));
        setCommentText("");
      } else {
        alert(json.error?.message || "Failed to post comment");
      }
    } finally {
      setIsPostingComment(false);
    }
  };

  const openDrawer = async (item: any, mode: "request" | "swap" | "activity") => {
    setTargetItem(item);
    setDrawerMode(mode);
    setDrawerStep("intent");
    setSelectedOwnItem(null);
    setSubmitted(false);
    setIsDrawerOpen(true);
    setItemActivity(null);
    setCommentText("");

    if (mode === "activity") {
      try {
        const res = await fetch(`/api/items/${item.id}`);
        const json = await res.json();
        if (json.success) setItemActivity(json.data);
      } catch (e) { console.error(e); }
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => { setTargetItem(null); setDrawerStep("intent"); }, 300);
  };

  const isIntentStep = drawerStep === "intent";
  const isContactStep = drawerStep === "contact";
  const intentButtonDisabled = (drawerMode === "swap" && !selectedOwnItem) || submitting || submitted;

  return (
    <div className={`min-h-full bg-background text-foreground selection:bg-foreground selection:text-background relative overflow-x-hidden`}>
      <div className="max-w-[1800px] mx-auto px-6 py-6 flex flex-col gap-6">

        <div className="flex flex-col xl:flex-row gap-8 items-stretch mb-0">
          {/* LEFT SIDE */}
          <div className="flex-grow overflow-hidden flex flex-col min-h-0">

            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-card border border-foreground/10 shrink-0">
              <div className="flex items-center gap-2 border-r border-foreground/10 pr-4">
                <SlidersHorizontal className="w-4 h-4 text-fg-muted" />
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Filters</span>
              </div>
              <div className="flex items-center bg-background border border-foreground/10 focus-within:border-foreground/40 transition-colors px-3 py-1.5 cursor-pointer">
                <MapPin className="w-3 h-3 text-fg-subtle mr-2" />
                <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none cursor-pointer">
                  <option value="current">Current Location</option>
                  <option value="downtown">Downtown</option>
                  <option value="suburbs">Suburbs</option>
                </select>
              </div>
              <div className="flex items-center bg-background border border-foreground/10 focus-within:border-foreground/40 transition-colors px-3 py-1.5 cursor-pointer">
                <DollarSign className="w-3 h-3 text-fg-subtle mr-2" />
                <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-foreground focus:outline-none cursor-pointer">
                  <option value="all">Any Value</option>
                  <option value="high">High Value Archive</option>
                </select>
              </div>
              <div className="flex items-center bg-background border border-foreground/10 focus-within:border-foreground/40 transition-colors px-3 py-1.5 cursor-pointer">
                <Tag className="w-3 h-3 text-fg-subtle mr-2" />
                <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-fg-muted focus:outline-none cursor-pointer hover:text-foreground transition-colors">
                  <option value="all">Any Condition</option>
                  <option value="new">Brand New</option>
                  <option value="used">Pre-Owned</option>
                </select>
              </div>
              <div className="ml-auto flex gap-3">
                {["mens", "womens", "unisex"].map(gender => (
                  <button
                    key={gender}
                    onClick={() => setActiveGender(gender)}
                    className={`px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all border ${
                      activeGender === gender ? 'bg-foreground text-background border-foreground' : 'bg-background text-fg-subtle border-foreground/10 hover:text-foreground hover:border-foreground/40'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mb-3 shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-fg-faint">
                {loading ? "Loading..." : `${liveFeed.length} Free Drop${liveFeed.length !== 1 ? "s" : ""}`}
              </span>
              <div className="flex gap-2">
                <button onClick={() => scrollFeed('left')} className="w-8 h-8 flex items-center justify-center bg-foreground/5 hover:bg-foreground hover:text-background transition-colors rounded-full border border-foreground/10 outline-none">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollFeed('right')} className="w-8 h-8 flex items-center justify-center bg-foreground/5 hover:bg-foreground hover:text-background transition-colors rounded-full border border-foreground/10 outline-none">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex gap-4 flex-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-[220px] shrink-0 bg-card border border-foreground/5 animate-pulse">
                    <div className="w-full aspect-[4/5] bg-surface-2" />
                    <div className="p-5 flex flex-col gap-2">
                      <div className="h-2.5 w-16 bg-surface-3" />
                      <div className="h-4 w-3/4 bg-surface-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : liveFeed.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-foreground/5 border-dashed gap-4">
                <PackageOpen className="w-8 h-8 text-fg-ghost" strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-widest text-fg-faint">No drops yet</p>
                <button onClick={() => router.push('/list-stuffs/create')} className="text-[9px] font-black uppercase tracking-widest text-black bg-brand px-5 py-2.5 flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Be the first to drop
                </button>
              </div>
            ) : (
              <div
                ref={feedScrollRef}
                className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {liveFeed.map(item => (
                  <div
                    key={item.id}
                    onClick={() => openDrawer(item, "activity")}
                    className="w-[220px] shrink-0 snap-start group flex flex-col bg-background border border-foreground/10 hover:border-foreground/40 transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative w-full h-[180px] overflow-hidden bg-foreground/85">
                      <div className="absolute top-2 left-2 z-20 bg-background/80 backdrop-blur-md px-2 py-1 text-[8px] font-black tracking-widest uppercase text-foreground border border-foreground/10">
                        {item.queueCount} Requests
                      </div>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-contain mix-blend-multiply p-4 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-card">
                          <PackageOpen className="w-8 h-8 text-fg-ghost" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-[9px] font-black tracking-widest uppercase text-fg-subtle mb-1">{item.brand || "—"}</h3>
                      <p className="text-sm font-bold text-foreground uppercase leading-snug line-clamp-2">{item.title}</p>
                      <div className="w-full h-px bg-foreground/10 mt-4 mb-4" />
                      <div className="mt-auto flex items-center justify-between">
                        <button className="text-fg-subtle hover:text-foreground transition-colors flex items-center gap-2 outline-none bg-transparent border-none p-0">
                          <Heart className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); openDrawer(item, "request"); }}
                          className="text-foreground hover:text-brand-ink transition-colors outline-none bg-transparent border-none p-0"
                        >
                          <Hand className="w-5 h-5 -rotate-12" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Market Pulse */}
          <aside className="w-full xl:w-[350px] shrink-0 flex flex-col h-[360px]">
            <div className="border border-foreground/10 bg-card flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-foreground/10 bg-background shrink-0">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-foreground fill-foreground" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Market Pulse</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest">Live</span>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-foreground/5 overflow-y-auto no-scrollbar flex-1">
                {pulseEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Zap className="w-6 h-6 text-fg-ghost" strokeWidth={1} />
                    <p className="text-[9px] font-black uppercase tracking-widest text-fg-ghost">No activity yet</p>
                  </div>
                ) : (
                  pulseEvents.map(event => (
                    <div key={event.id} className="p-4 hover:bg-surface-2 transition-colors flex flex-col group cursor-pointer" onClick={() => openDrawer(event, "activity")}>
                      <div className="flex gap-4">
                        <div className="w-12 h-12 shrink-0 bg-background overflow-hidden border border-foreground/10">
                          {event.imageUrl ? (
                            <img src={event.imageUrl} alt={event.itemTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><PackageOpen className="w-5 h-5 text-fg-ghost" strokeWidth={1} /></div>
                          )}
                        </div>
                        <div className="flex-grow flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] leading-tight">
                              <span className="text-fg-muted font-bold">@{event.user}</span>
                              <span className="mx-1 text-fg-faint">dropped</span>
                            </p>
                            <span className="text-[8px] text-fg-faint font-bold uppercase tracking-widest whitespace-nowrap ml-2">{event.time}</span>
                          </div>
                          <div className="text-[11px] text-foreground font-bold uppercase tracking-tight line-clamp-1">{event.itemTitle}</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 flex items-center justify-between border-t border-foreground/5">
                        <button className="text-fg-subtle hover:text-foreground transition-colors flex items-center gap-2 outline-none bg-transparent border-none p-0">
                          <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); openDrawer(event, "request"); }}
                          className="text-foreground hover:text-green-400 transition-colors outline-none bg-transparent border-none p-0"
                        >
                          <Hand className="w-4 h-4 -rotate-12" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* EXCHANGE SECTION */}
        <section className="w-full pt-2 pb-12 border-t border-foreground/10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ArrowLeftRight className="w-5 h-5 text-fg-muted" />
                <h2 className="text-2xl font-black tracking-tighter uppercase">Exchange Stuffs</h2>
              </div>
              <p className="text-[10px] text-fg-subtle font-bold uppercase tracking-widest">Trade items directly. Propose swaps to the community.</p>
            </div>
            <button onClick={() => router.push('/exchange')} className="bg-background border border-foreground/20 text-foreground px-5 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
              Browse All Exchange
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-foreground/5 animate-pulse">
                  <div className="w-full h-32 bg-surface-2" />
                  <div className="p-5 flex flex-col gap-2"><div className="h-3 w-3/4 bg-surface-3" /><div className="h-8 w-full bg-surface-3 mt-1" /></div>
                </div>
              ))}
            </div>
          ) : exchangeFeed.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center border border-foreground/5 border-dashed gap-4">
              <ArrowLeftRight className="w-8 h-8 text-fg-ghost" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest text-fg-faint">No exchanges listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {exchangeFeed.slice(0, 4).map(barter => (
                <div
                  key={barter.id}
                  onClick={() => openDrawer(barter, "activity")}
                  className="group relative flex flex-col w-full aspect-[3/4] overflow-hidden border border-foreground/10 hover:border-foreground/40 transition-all cursor-pointer bg-background"
                >
                  {barter.imageUrl ? (
                    <img src={barter.imageUrl} alt={barter.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-card"><PackageOpen className="w-8 h-8 text-fg-ghost" strokeWidth={1} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent/10 z-10" />
                  <div className="absolute top-3 left-3 z-20 bg-background/80 backdrop-blur-md px-2 py-1 text-[8px] font-black tracking-widest uppercase text-foreground border border-foreground/10">Offering</div>
                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 flex flex-col">
                    <h3 className="text-sm font-black text-foreground leading-tight uppercase mb-3 line-clamp-1 drop-shadow-md">{barter.title}</h3>
                    <div className="bg-background/50 backdrop-blur-md border border-foreground/10 p-3 mb-4 rounded-sm">
                      <span className="block text-[8px] font-black text-fg-muted uppercase tracking-widest mb-1">Seeking</span>
                      <p className="text-[11px] text-foreground font-bold line-clamp-2 drop-shadow-md">{barter.seeking || "Open to offers"}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-foreground/20">
                      <button className="text-fg-soft hover:text-foreground transition-colors flex items-center gap-2 outline-none bg-transparent border-none p-0 drop-shadow-md">
                        <Heart className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); openDrawer(barter, "swap"); }}
                        className="text-foreground hover:text-brand-ink transition-colors outline-none bg-transparent border-none p-0 drop-shadow-md"
                      >
                        <Handshake className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* DRAWER BACKDROP */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity" onClick={closeDrawer} />}

      {/* SLIDE-OVER DRAWER */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-[450px] bg-background border-l border-foreground/10 z-[101] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Drawer header */}
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-background shrink-0">
          <div className="flex items-center gap-3">
            {drawerMode === "swap" && <Handshake className="w-5 h-5 text-foreground" strokeWidth={1.5} />}
            {drawerMode === "request" && <Hand className="w-5 h-5 text-foreground -rotate-12" strokeWidth={1.5} />}
            {drawerMode === "activity" && <MessageSquare className="w-5 h-5 text-foreground" strokeWidth={1.5} />}
            <h2 className="text-lg font-black uppercase tracking-tighter">
              {drawerMode === "swap" ? "Propose Swap" : drawerMode === "request" ? "Request Item" : "Pulse Activity"}
            </h2>
          </div>
          {/* Step dots — only for request/swap */}
          {(drawerMode === "request" || drawerMode === "swap") && (
            <div className="flex items-center gap-2 mr-auto ml-4">
              <div className={`w-2 h-2 rounded-full transition-colors ${isIntentStep ? "bg-foreground" : "bg-surface-4"}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${isContactStep ? "bg-brand" : "bg-surface-4"}`} />
            </div>
          )}
          <button onClick={closeDrawer} className="p-2 text-fg-subtle hover:text-foreground hover:bg-foreground/5 transition-colors outline-none bg-transparent border-none">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {targetItem && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">

            {/* ── CONTACT STEP ── */}
            {(drawerMode === "request" || drawerMode === "swap") && isContactStep && (
              <ContactStep
                onBack={() => setDrawerStep("intent")}
                onSubmit={handleRequest}
                submitting={submitting}
              />
            )}

            {/* ── INTENT STEP ── */}
            {(drawerMode === "request" || drawerMode === "swap") && isIntentStep && (
              <>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-3">
                    {drawerMode === "swap" ? "You are proposing a trade for" : "You are requesting"}
                  </span>
                  <div className="flex gap-4 p-4 border border-foreground/10 bg-card">
                    {(targetItem.imageUrl || targetItem.offeringImage) && (
                      <img src={targetItem.imageUrl || targetItem.offeringImage} alt="Item" className="w-16 h-16 object-cover border border-foreground/5" />
                    )}
                    <div className="flex flex-col justify-center">
                      <span className="text-xs font-bold text-foreground uppercase leading-tight mb-1">
                        {targetItem.title || targetItem.offeringTitle || targetItem.itemTitle}
                      </span>
                      {targetItem.seeking && (
                        <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest">Seeking: {targetItem.seeking}</span>
                      )}
                      <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest mt-1">
                        By @{targetItem.user || targetItem.giver?.username || "curator"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle">
                      {drawerMode === "swap" ? "Select item to offer" : "Offer an item in exchange (Optional)"}
                    </span>
                    <button onClick={() => router.push('/list-stuffs/create')} className="text-[9px] font-bold uppercase tracking-widest text-fg-muted hover:text-foreground border-b border-foreground/30 hover:border-foreground transition-colors bg-transparent outline-none">
                      Upload New +
                    </button>
                  </div>
                  {myInventory.length === 0 ? (
                    <p className="text-[10px] text-fg-faint uppercase tracking-widest text-center py-8 border border-foreground/5 border-dashed">
                      You have no items in your archive yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {myInventory.map(myObj => {
                        const isSelected = selectedOwnItem === myObj.id;
                        return (
                          <div
                            key={myObj.id}
                            onClick={() => setSelectedOwnItem(isSelected ? null : myObj.id)}
                            className={`relative cursor-pointer group border transition-all ${isSelected ? 'border-foreground bg-foreground/5' : 'border-foreground/10 hover:border-foreground/40 bg-background'}`}
                          >
                            <div className="w-full aspect-square overflow-hidden border-b border-foreground/5">
                              {myObj.imageUrl ? (
                                <img src={myObj.imageUrl} alt={myObj.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-2">
                                  <PackageOpen className="w-6 h-6 text-fg-ghost" strokeWidth={1} />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-fg-soft line-clamp-2 leading-snug">{myObj.title}</p>
                            </div>
                            {isSelected && <div className="absolute top-2 right-2 bg-foreground text-background p-1"><Check className="w-3 h-3" strokeWidth={4} /></div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── ACTIVITY mode ── */}
            {drawerMode === "activity" && (
              <div className="flex flex-col gap-8">
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-3">Discussing this drop</span>
                  <div className="flex gap-4 p-4 border border-foreground/10 bg-card">
                    {(targetItem.imageUrl || targetItem.offeringImage) && (
                      <img src={targetItem.imageUrl || targetItem.offeringImage} alt="Item" className="w-16 h-16 object-cover border border-foreground/5" />
                    )}
                    <div className="flex flex-col justify-center">
                      <span className="text-xs font-bold text-foreground uppercase leading-tight mb-1">
                        {targetItem.title || targetItem.offeringTitle || targetItem.itemTitle}
                      </span>
                      <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest mt-1">
                        By @{targetItem.user || targetItem.giver?.username || "curator"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-foreground/10 pt-8 flex flex-col gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-fg-subtle">
                        Current Queue ({itemActivity ? itemActivity.requests?.length : targetItem.queueCount || 0})
                      </span>
                      <button
                        onClick={() => setDrawerMode(targetItem.seeking ? "swap" : "request")}
                        className="text-[9px] font-bold uppercase tracking-widest text-foreground border border-foreground/20 hover:bg-foreground hover:text-background px-3 py-1.5 transition-colors bg-transparent outline-none"
                      >
                        Join Queue
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {!itemActivity ? (
                        <div className="text-[10px] text-fg-subtle animate-pulse">Loading queue...</div>
                      ) : itemActivity.requests?.length === 0 ? (
                        <div className="text-[10px] text-fg-subtle">No requests yet. Be the first!</div>
                      ) : (
                        itemActivity.requests?.map((req: any, i: number) => (
                          <div key={req.id} className="flex flex-col border border-foreground/10 bg-background hover:border-foreground/30 transition-colors p-3 gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-fg-faint">#{i + 1}</span>
                                <span className="text-[10px] font-bold text-foreground uppercase">@{req.requester.username}</span>
                              </div>
                              <span className="text-[8px] font-black tracking-widest text-fg-subtle uppercase">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {req.message && req.message.includes("Swap proposal") && (
                              <div className="flex gap-3 items-center border-t border-foreground/5 pt-3">
                                <div className="flex-grow">
                                  <p className="text-[8px] text-fg-subtle uppercase tracking-widest mb-0.5">Offered to trade:</p>
                                  <p className="text-[10px] font-bold text-fg-soft line-clamp-1">{req.message.replace('Swap proposal: offering item ', 'Item ID: ')}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-4 block">
                      Comments ({itemActivity?.comments?.length || 0})
                    </span>
                    <div className="flex flex-col gap-4">
                      {!itemActivity ? (
                        <div className="text-[10px] text-fg-subtle animate-pulse">Loading comments...</div>
                      ) : itemActivity.comments?.length === 0 ? (
                        <div className="text-[10px] text-fg-subtle">No comments yet.</div>
                      ) : (
                        itemActivity.comments?.map((c: any) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="w-6 h-6 shrink-0 rounded-full bg-surface-3 flex items-center justify-center border border-foreground/10 overflow-hidden">
                              {c.user.avatar ? <img src={c.user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-fg-muted" />}
                            </div>
                            <div>
                              <p className="text-[10px] leading-tight mb-1">
                                <span className="font-bold text-foreground uppercase">@{c.user.username}</span>
                                <span className="text-[8px] font-black tracking-widest text-fg-faint uppercase ml-2">{timeAgo(c.createdAt)}</span>
                              </p>
                              <p className="text-[11px] text-fg-soft font-medium">{c.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drawer footer */}
        <div className="p-6 border-t border-foreground/10 bg-background mt-auto shrink-0">
          {/* Intent step: "Next" advances to contact form */}
          {(drawerMode === "request" || drawerMode === "swap") && isIntentStep && (
            <button
              onClick={handleProceedToContact}
              disabled={intentButtonDisabled}
              className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 outline-none ${
                submitted ? 'bg-brand text-black cursor-default' :
                !intentButtonDisabled ? 'bg-foreground text-background hover:bg-foreground/80 cursor-pointer' :
                'bg-surface-2 text-fg-faint cursor-not-allowed border-none'
              }`}
            >
              {submitted ? 'Request Sent ✓' :
                drawerMode === "swap"
                  ? (selectedOwnItem ? 'Next: Add Your Details →' : 'Select an Item First')
                  : 'Next: Add Your Details →'}
            </button>
          )}

          {/* Activity: comment box */}
          {drawerMode === "activity" && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                placeholder="Write a comment..."
                className="flex-grow bg-card border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-foreground/40 transition-colors placeholder:text-fg-faint"
              />
              <button
                onClick={handlePostComment}
                disabled={isPostingComment || !commentText.trim()}
                className={`border-none outline-none px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  isPostingComment || !commentText.trim() ? "bg-surface-2 text-fg-faint cursor-not-allowed" : "bg-foreground text-background hover:bg-foreground/80 cursor-pointer"
                }`}
              >
                {isPostingComment ? "..." : "Post"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}