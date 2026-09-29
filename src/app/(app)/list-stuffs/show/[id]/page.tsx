"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Users, Heart, ArrowLeftRight, Gift, 
  Check, PackageOpen, X, ShieldCheck,
  Truck, CheckCircle2, AlertCircle, KeyRound
} from "lucide-react";


// ── THE RECEIVER'S DELIVERY TRACKER ──
const ReceiverDeliveryTracker = ({ requestId }: { requestId: string }) => {
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isDisputing, setIsDisputing] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    fetch(`/api/delivery?requestId=${requestId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setDelivery(j.data); })
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleAction = async (action: string, payload = {}) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, requestId, ...payload })
      });
      const json = await res.json();
      if (json.success) {
        // Refresh delivery state
        const refresh = await fetch(`/api/delivery?requestId=${requestId}`).then(r => r.json());
        if (refresh.success) setDelivery(refresh.data);
        setIsDisputing(false);
      } else {
        alert(json.error?.message || "Action failed");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="mt-8 p-5 border border-brand-ink/20 text-[10px] text-brand-ink animate-pulse uppercase tracking-widest">Syncing Delivery Protocol...</div>;
  if (!delivery) return null;

  const isOtpMode = ['MEETUP', 'PRIVATE_DISPATCH'].includes(delivery.deliveryMethod);

  return (
    <div className="mt-8 border border-brand-ink/30 bg-brand/5 p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-brand-ink/20 pb-3">
        <Truck className="w-5 h-5 text-brand-ink" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-ink">Active Delivery Tracker</h3>
      </div>

      {!delivery.deliveryStatus || delivery.deliveryStatus === 'PENDING_DISPATCH' ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-fg-soft leading-relaxed">
            The giver is currently preparing your item for dispatch.
          </p>
          <p className="text-[9px] text-fg-subtle uppercase tracking-widest">Check back shortly for tracking details or your security OTP.</p>
        </div>
      ) : delivery.deliveryStatus === 'IN_TRANSIT' ? (
        <div className="flex flex-col gap-6">
          {isOtpMode ? (
            <div className="flex flex-col items-center justify-center bg-background border border-brand-ink/30 py-8 px-4 rounded-sm shadow-[0_0_30px_rgba(0,255,178,0.1)]">
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-3">
                <KeyRound className="w-3.5 h-3.5" /> Your Secret OTP
              </span>
              <span className="text-6xl md:text-7xl font-black tracking-[0.2em] text-brand-ink drop-shadow-lg">{delivery.deliveryOtp}</span>
              <p className="text-[9px] text-fg-muted max-w-sm text-center mt-5 uppercase tracking-widest leading-relaxed">
                Provide this code to the rider or giver ONLY after you have inspected the item. This confirms delivery and releases their deposit.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 bg-background p-5 border border-foreground/10 rounded-sm">
               <p className="text-[11px] font-bold uppercase tracking-widest text-fg-soft">
                 Item has been dispatched via <span className="text-brand-ink">{delivery.deliveryMethod}</span>.
               </p>
               <div className="flex flex-col gap-1.5 border-l-2 border-foreground/20 pl-3">
                 {delivery.dispatchDetails && <p className="text-[10px] font-medium text-fg-muted"><span className="text-fg-faint uppercase tracking-widest font-black mr-2">Details:</span> {delivery.dispatchDetails}</p>}
                 {delivery.parkLocation && <p className="text-[10px] font-medium text-fg-muted"><span className="text-fg-faint uppercase tracking-widest font-black mr-2">Park:</span> {delivery.parkLocation}</p>}
                 {delivery.trackingNumber && <p className="text-[10px] font-medium text-fg-muted"><span className="text-fg-faint uppercase tracking-widest font-black mr-2">Tracking:</span> {delivery.trackingNumber} ({delivery.courierName})</p>}
               </div>

               <button
                 onClick={() => handleAction('receiver_confirm')}
                 disabled={processing}
                 className="mt-2 bg-brand text-black font-black uppercase tracking-[0.15em] text-[10px] py-3.5 hover:bg-foreground transition-all rounded-sm active:scale-[0.98] hover:text-background"
               >
                 Confirm Receipt & Release Funds
               </button>
            </div>
          )}

          {/* Dispute Section */}
          {!isDisputing ? (
            <button onClick={() => setIsDisputing(true)} className="text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 self-start outline-none bg-transparent flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Problem with the item? Raise a dispute.
            </button>
          ) : (
            <div className="flex flex-col gap-3 border-t border-red-500/20 pt-5 mt-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Raise a Dispute
              </span>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="Describe what is wrong (e.g. fake, damaged, wrong item)..."
                className="w-full bg-background border border-red-500/30 text-foreground text-xs p-4 focus:outline-none focus:border-red-500/80 rounded-sm resize-none"
                rows={3}
              />
              <div className="flex gap-3">
                <button onClick={() => setIsDisputing(false)} className="flex-1 border border-foreground/10 text-fg-muted py-3 text-[9px] font-bold uppercase tracking-widest hover:text-foreground transition-colors rounded-sm">Cancel</button>
                <button onClick={() => handleAction('raise_dispute', { disputeReason })} disabled={processing || !disputeReason.trim()} className="flex-1 bg-red-500 text-foreground py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed">Submit Dispute</button>
              </div>
            </div>
          )}
        </div>
      ) : delivery.deliveryStatus === 'DELIVERED' ? (
        <div className="flex flex-col items-center gap-3 py-6 bg-background border border-brand-ink/20 rounded-sm">
          <CheckCircle2 className="w-12 h-12 text-brand-ink" />
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Delivery Complete</h3>
          <p className="text-[10px] text-fg-muted uppercase tracking-widest text-center max-w-xs">You have successfully received this item. Escrow deposits have been released.</p>
        </div>
      ) : delivery.deliveryStatus === 'DISPUTED' ? (
        <div className="flex flex-col items-center gap-3 py-6 bg-background border border-red-500/20 rounded-sm">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h3 className="text-xl font-black uppercase tracking-widest text-red-500">Delivery Disputed</h3>
          <p className="text-[10px] text-red-400 uppercase tracking-widest text-center max-w-xs">Our moderation team is currently reviewing your dispute. We will contact you shortly.</p>
        </div>
      ) : null} {/* <--- THIS NULL FIXES THE BUG */}
    </div>
  );
};


// ── MAIN PAGE COMPONENT ──
export default function PublicItemShowPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [selectedOwnItem, setSelectedOwnItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined') return;

    fetch(`/api/items/${id}`)
      .then(res => res.json())
      .then(json => { 
        if (json.success) setItem(json.data); 
      })
      .finally(() => setLoading(false));

    fetch('/api/saved')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data.some((s: any) => s.itemId === id)) {
          setSaved(true);
        }
      });
  }, [id]);

  const toggleSave = async () => {
    setSaved(!saved);
    if (!saved) {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id }),
      });
    } else {
      await fetch(`/api/saved?itemId=${id}`, { method: 'DELETE' });
    }
  };

  const openDrawer = async () => {
    setIsDrawerOpen(true);
    setSubmitted(false);
    setSelectedOwnItem(null);

    if (item?.isExchange && myInventory.length === 0) {
      setDrawerLoading(true);
      try {
        const res = await fetch('/api/items?mine=true');
        const json = await res.json();
        if (json.success) setMyInventory(json.data.filter((i: any) => i.status === 'active' || i.status === 'AVAILABLE'));
      } finally {
        setDrawerLoading(false);
      }
    }
  };

  const handleRequest = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const message = selectedOwnItem ? `Swap proposal: offering item ${selectedOwnItem}` : "Requested for free";
      
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, message }),
      });
      
      if (res.ok || res.status === 409) {
        setSubmitted(true);
        setTimeout(() => {
          setIsDrawerOpen(false);
          fetch(`/api/items/${id}`).then(r => r.json()).then(j => { if (j.success) setItem(j.data); });
        }, 1500);
      } else {
        const json = await res.json();
        alert(json.error?.message || "Failed to submit request.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!id || id === 'undefined' || loading) return <div className="min-h-full bg-background" />;
  if (!item) return <div className="min-h-full bg-background flex items-center justify-center text-foreground">Item not found.</div>;

  const isClaimed = item.status === "CLAIMED" || item.status === "IN_TRANSIT" || item.status === "DELIVERED" || item.status === "DISPUTED";
  const joinedDate = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className={`min-h-full bg-background text-foreground selection:bg-brand selection:text-black pb-32`}>
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-subtle hover:text-foreground transition-colors outline-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Ledger
          </button>
          
          <button 
            onClick={toggleSave}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 border transition-all rounded-sm outline-none ${
              saved ? "border-brand-ink text-brand-ink bg-brand/10" : "border-foreground/10 text-fg-muted hover:text-foreground hover:border-foreground/40"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? "fill-brand" : ""}`} /> 
            {saved ? "Saved to Wishlist" : "Save to Wishlist"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
          
          {/* LEFT: Massive Image Viewer */}
          <div className="w-full lg:w-1/2 shrink-0">
            <div className="w-full aspect-[4/5] bg-card border border-foreground/10 relative group rounded-sm overflow-hidden">
              {item.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={item.images[0]} 
                  alt={item.title} 
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <PackageOpen className="w-12 h-12 text-fg-ghost" strokeWidth={1} />
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {item.isExchange ? (
                  <span className="bg-background/80 backdrop-blur-md px-3 py-1.5 text-[9px] font-black tracking-[0.2em] uppercase text-brand-ink border border-brand-ink/30 flex items-center gap-1.5 shadow-xl w-fit rounded-sm">
                    <ArrowLeftRight className="w-3 h-3" strokeWidth={2} /> Exchange
                  </span>
                ) : (
                  <span className="bg-background/80 backdrop-blur-md px-3 py-1.5 text-[9px] font-black tracking-[0.2em] uppercase text-foreground border border-foreground/20 flex items-center gap-1.5 shadow-xl w-fit rounded-sm">
                    <Gift className="w-3 h-3" strokeWidth={2} /> Free Drop
                  </span>
                )}
                {isClaimed && (
                  <span className="bg-red-500/90 backdrop-blur-md px-3 py-1.5 text-[9px] font-black tracking-[0.2em] uppercase text-foreground border border-red-500/50 flex items-center gap-1.5 shadow-xl w-fit rounded-sm">
                    {item.status === 'CLAIMED' ? 'CLAIMED & LOCKED' : item.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Editorial Info & Actions */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 lg:pt-8">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full border border-foreground/20 bg-surface-3 overflow-hidden flex items-center justify-center shrink-0">
                {item.giver.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.giver.avatar} alt={item.giver.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-black text-foreground">{item.giver.username.slice(0,2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider leading-none">@{item.giver.username}</span>
                <span className="text-[8px] text-fg-subtle uppercase tracking-widest mt-0.5">Dropped {joinedDate}</span>
              </div>
            </div>

            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-fg-subtle mb-2">
              {item.brand || "Independent"}
            </h2>
            
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-[1.1] mb-6">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="px-4 py-2 border border-foreground/10 bg-foreground/5 text-[10px] font-bold uppercase tracking-widest text-fg-soft rounded-sm">
                {item.category}
              </span>
              <span className="px-4 py-2 border border-foreground/10 bg-foreground/5 text-[10px] font-bold uppercase tracking-widest text-fg-soft rounded-sm">
                {item.condition}
              </span>
              {item.size && (
                <span className="px-4 py-2 border border-brand-ink/20 bg-brand/5 text-[10px] font-bold uppercase tracking-widest text-brand-ink rounded-sm">
                  Size {item.size}
                </span>
              )}
            </div>

            <p className="text-sm text-fg-muted font-medium leading-relaxed mb-10 max-w-xl">
              {item.description || "No curation notes provided for this asset."}
            </p>

            {item.isExchange && item.seekingDescription && (
              <div className="p-5 border border-foreground/10 bg-card rounded-sm mb-10 border-l-4 border-l-[#00FFB2]">
                <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-ink mb-1.5">
                  Target Asset Sought
                </span>
                <p className="text-sm font-bold text-foreground uppercase tracking-wide">
                  {item.seekingDescription}
                </p>
              </div>
            )}

            <div className="mt-auto border-t border-foreground/10 pt-8 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-subtle flex items-center gap-2">
                  <Users className="w-4 h-4" /> Queue Status
                </span>
                <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">
                  {item.requests?.length || 0} Interested
                </span>
              </div>

              {/* ── CONDITIONAL BUTTON RENDERER ── */}
              {item.isOwner ? (
                <button 
                  onClick={() => router.push(`/my-drops/show/${item.id}`)}
                  className="w-full py-5 bg-foreground text-background text-[11px] font-black uppercase tracking-[0.2em] hover:bg-foreground/80 transition-all rounded-sm flex items-center justify-center gap-2"
                >
                  Manage Your Drop Queue
                </button>
              ) : item.isWinner ? (
                // IF THE RECEIVER WON, SHOW THE DELIVERY TRACKER!
                <ReceiverDeliveryTracker requestId={item.requests?.find((r: any) => r.status === 'ACCEPTED')?.id} />
              ) : isClaimed ? (
                <button disabled className="w-full py-5 bg-surface-2 text-fg-subtle text-[11px] font-black uppercase tracking-[0.2em] cursor-not-allowed rounded-sm border border-foreground/15 flex items-center justify-center gap-2 mt-4">
                  Asset Already Claimed
                </button>
              ) : (
                <button 
                  onClick={openDrawer}
                  className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(0,255,178,0.15)] hover:shadow-[0_0_30px_rgba(0,255,178,0.3)] active:scale-[0.98] ${
                    item.isExchange 
                      ? "bg-transparent border border-brand-ink text-brand-ink hover:bg-brand/10" 
                      : "bg-brand text-black hover:bg-brand/85"
                  }`}
                >
                  {item.isExchange ? "Propose Swap" : "Request For Free"}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── DRAWER BACKDROP ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity" onClick={() => setIsDrawerOpen(false)} />
      )}

      {/* ── SLIDE-OVER DRAWER ── */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-[450px] bg-background border-l border-foreground/10 z-[101] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-foreground/10 bg-background shrink-0">
          <div className="flex items-center gap-3">
            {item.isExchange ? <ArrowLeftRight className="w-5 h-5 text-foreground" strokeWidth={1.5} /> : <Gift className="w-5 h-5 text-foreground" strokeWidth={1.5} />}
            <h2 className="text-lg font-black uppercase tracking-tighter">
              {item.isExchange ? "Propose Swap" : "Request Item"}
            </h2>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-fg-subtle hover:text-foreground hover:bg-foreground/5 transition-colors outline-none bg-transparent border-none rounded-sm">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar">
          {/* Target Item Summary */}
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle mb-3">
              {item.isExchange ? "You are proposing a trade for" : "You are requesting"}
            </span>
            <div className="flex gap-4 p-4 border border-foreground/10 bg-card rounded-sm">
              {item.images?.[0] ? (
                <div className="relative w-16 h-16 shrink-0 border border-foreground/5 rounded-sm overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.images[0]} alt="Item" className="w-full h-full object-cover absolute inset-0" />
                </div>
              ) : (
                <div className="w-16 h-16 shrink-0 border border-foreground/5 bg-surface-2 flex items-center justify-center rounded-sm">
                  <PackageOpen className="w-6 h-6 text-fg-ghost" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-foreground uppercase leading-tight mb-1 line-clamp-2">
                  {item.title}
                </span>
                <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest mt-1">
                  By @{item.giver.username}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-foreground/10 flex items-center justify-center bg-background text-fg-subtle">
              {item.isExchange ? <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Gift className="w-3.5 h-3.5" strokeWidth={1.5} />}
            </div>
          </div>

          {/* Swap Selection Logic */}
          {item.isExchange ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="block text-[9px] font-black uppercase tracking-widest text-fg-subtle">
                  Select item to offer
                </span>
                <button onClick={() => router.push('/list-stuffs/create')} className="text-[9px] font-bold uppercase tracking-widest text-fg-muted hover:text-foreground border-b border-foreground/30 hover:border-foreground transition-colors bg-transparent outline-none pb-0.5">
                  Upload New +
                </button>
              </div>

              {drawerLoading ? (
                <div className="text-[10px] font-bold text-fg-subtle uppercase tracking-widest animate-pulse text-center py-8">Loading your archive...</div>
              ) : myInventory.length === 0 ? (
                <p className="text-[10px] text-fg-faint uppercase tracking-widest text-center py-8 border border-foreground/5 border-dashed rounded-sm">
                  You have no items in your archive to offer.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {myInventory.map((myObj) => {
                    const isSelected = selectedOwnItem === myObj.id;
                    return (
                      <div
                        key={myObj.id}
                        onClick={() => setSelectedOwnItem(myObj.id)}
                        className={`relative cursor-pointer group border rounded-sm transition-all overflow-hidden ${
                          isSelected ? 'border-brand-ink bg-brand/5' : 'border-foreground/10 hover:border-foreground/40 bg-background'
                        }`}
                      >
                        <div className="relative w-full aspect-square overflow-hidden border-b border-foreground/5 bg-surface-2">
                          {myObj.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={myObj.imageUrl} alt={myObj.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity absolute inset-0" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center"><PackageOpen className="w-6 h-6 text-fg-ghost" /></div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-fg-soft line-clamp-2 leading-snug">{myObj.title}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-brand text-black p-1 rounded-sm">
                            <Check className="w-3 h-3" strokeWidth={4} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
             <div className="border border-foreground/10 bg-foreground/5 p-5 rounded-sm">
               <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground mb-2">
                 <ShieldCheck className="w-4 h-4 text-brand-ink" /> Free Request
               </span>
               <p className="text-[10px] text-fg-muted leading-relaxed font-medium">
                 By joining the queue, you are requesting this item from the owner at no cost. The owner will review all requests and select a recipient.
               </p>
             </div>
          )}
        </div>

        {/* Drawer Action Button */}
        <div className="p-6 border-t border-foreground/10 bg-background mt-auto shrink-0">
          <button
            onClick={handleRequest}
            disabled={(item.isExchange && !selectedOwnItem) || submitting || submitted}
            className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 outline-none rounded-sm ${
              submitted
                ? 'bg-brand text-black cursor-default'
                : (item.isExchange && !selectedOwnItem)
                  ? 'bg-surface-2 text-fg-faint cursor-not-allowed border border-foreground/15'
                  : 'bg-foreground text-background hover:bg-foreground/80 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]'
            }`}
          >
            {submitted
              ? 'Request Sent ✓'
              : submitting
                ? 'Transmitting...'
                : item.isExchange
                  ? (selectedOwnItem ? 'Send Proposal' : 'Select an Item First')
                  : 'Confirm Free Request'}
          </button>
        </div>
      </div>

    </div>
  );
}