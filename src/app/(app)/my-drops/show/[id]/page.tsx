"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Users, Check, PackageOpen, AlertCircle, ArrowUpRight,
  Trophy, MessageSquare, CheckCircle2, AlertTriangle
} from "lucide-react";


const OfferedItemPreview = ({ itemId }: { itemId: string }) => {
  const [offeredItem, setOfferedItem] = useState<any>(null);

  useEffect(() => {
    if (!itemId || itemId === "undefined") return;
    fetch(`/api/items/${itemId}`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setOfferedItem(json.data); });
  }, [itemId]);

  if (!offeredItem)
    return <div className="text-[10px] text-fg-subtle animate-pulse mt-2">Loading offered item...</div>;

  return (
    <div className="mt-3 p-3 border border-foreground/10 bg-background flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-2 border border-foreground/5 overflow-hidden">
          {offeredItem.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offeredItem.images[0]} alt="offered" className="w-full h-full object-cover" />
          ) : (
            <PackageOpen className="w-5 h-5 m-2.5 text-fg-faint" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">Offered to trade</span>
          <span className="text-[10px] font-bold text-foreground uppercase truncate max-w-[150px]">{offeredItem.title}</span>
        </div>
      </div>
      <button
        onClick={() => window.open(`/list-stuffs/show/${itemId}`, "_blank")}
        className="w-8 h-8 flex items-center justify-center bg-foreground/5 hover:bg-foreground hover:text-background transition-colors rounded-sm"
      >
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Per-method dispatch form fields ───────────────────────────────────────────
// FIX #2: Each delivery method now sends the correct named fields that the
// backend actually reads (dispatchName, dispatchPhone, trackingNumber,
// courierName, parkLocation) instead of a single 'dispatchDetails' string
// that was silently dropped.

type DispatchPayload = {
  dispatchName?: string;
  dispatchPhone?: string;
  trackingNumber?: string;
  courierName?: string;
  parkLocation?: string;
  waybillReceiptUrl?: string;
};

function DispatchForm({
  method,
  onSubmit,
  loading,
}: {
  method: string;
  onSubmit: (payload: DispatchPayload) => void;
  loading: boolean;
}) {
  const [dispatchName, setDispatchName] = useState("");
  const [dispatchPhone, setDispatchPhone] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [parkLocation, setParkLocation] = useState("");

  const inputCls =
    "w-full bg-background border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-brand-ink placeholder:text-fg-faint transition-colors";

  const handleSubmit = () => {
    if (method === "PRIVATE_DISPATCH" || method === "MEETUP") {
      onSubmit({ dispatchName, dispatchPhone });
    } else if (method === "WAYBILL") {
      onSubmit({ parkLocation, trackingNumber });
    } else if (method === "COURIER") {
      onSubmit({ courierName, trackingNumber });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {(method === "PRIVATE_DISPATCH" || method === "MEETUP") && (
        <>
          <input
            type="text"
            placeholder="Rider / Contact Name"
            value={dispatchName}
            onChange={(e) => setDispatchName(e.target.value)}
            className={inputCls}
          />
          <input
            type="tel"
            placeholder="Rider / Contact Phone Number"
            value={dispatchPhone}
            onChange={(e) => setDispatchPhone(e.target.value)}
            className={inputCls}
          />
        </>
      )}

      {method === "WAYBILL" && (
        <>
          <input
            type="text"
            placeholder="Bus Park / Terminal Name"
            value={parkLocation}
            onChange={(e) => setParkLocation(e.target.value)}
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Waybill / Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className={inputCls}
          />
        </>
      )}

      {method === "COURIER" && (
        <>
          <input
            type="text"
            placeholder="Courier Company (e.g. DHL, Sendbox)"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className={inputCls}
          />
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-brand text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:text-background"
      >
        {loading ? "Processing..." : "Mark as Dispatched"}
      </button>
    </div>
  );
}

// ─── Status badge overlay label ────────────────────────────────────────────────
function statusOverlayLabel(status: string) {
  if (status === "IN_TRANSIT") return "In Transit";
  if (status === "DELIVERED") return "Delivered";
  if (status === "DISPUTED") return "Disputed";
  return "Claimed";
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyDropShowPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [delMethod, setDelMethod] = useState("PRIVATE_DISPATCH");
  const [otpInput, setOtpInput] = useState("");

  // Dispute form state
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  useEffect(() => {
    if (!id || id === "undefined") return;
    fetch(`/api/items/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setItem(json.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const refreshItem = async () => {
    const r = await fetch(`/api/items/${id}`).then((res) => res.json());
    if (r.success) setItem(r.data);
  };

  const acceptRequest = async (requestId: string) => {
    if (!confirm("Accept this request? All others will be rejected and this item will be locked.")) return;
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        await refreshItem();
      } else {
        alert(json.error?.message || "Failed to accept request");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeliveryAction = async (action: string, payload: any = {}, requestId: string) => {
    setProcessingId("delivery");
    try {
      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requestId, ...payload }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshItem();
        setShowDisputeForm(false);
        setDisputeReason("");
      } else {
        alert(json.error?.message || "Action failed");
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (!id || id === "undefined" || loading) return <div className="min-h-full bg-background" />;
  if (!item) return (
    <div className="min-h-full bg-background flex items-center justify-center text-foreground">
      Item not found.
    </div>
  );

  const isClaimed =
    item.status === "CLAIMED" ||
    item.status === "IN_TRANSIT" ||
    item.status === "DELIVERED" ||
    item.status === "DISPUTED";

  const acceptedReq = item.requests?.find((r: any) => r.status === "ACCEPTED");
  const isOtpMethod = acceptedReq?.deliveryMethod === "MEETUP";
  const isConfirmMethod =
    acceptedReq?.deliveryMethod === "WAYBILL" ||
    acceptedReq?.deliveryMethod === "COURIER" ||
    acceptedReq?.deliveryMethod === "PRIVATE_DISPATCH";

  return (
    <div className={`min-h-full bg-background text-foreground`}>
      <div className="max-w-[1200px] mx-auto px-6 py-10">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-subtle hover:text-foreground transition-colors mb-8 outline-none bg-transparent"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* LEFT: Item Visuals */}
          <div className="w-full lg:w-1/3 shrink-0 flex flex-col gap-6">
            <div className="w-full aspect-[4/5] bg-card border border-foreground/10 overflow-hidden relative">
              {item.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <PackageOpen className="w-8 h-8 text-fg-ghost" />
                </div>
              )}
              {isClaimed && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-foreground text-lg font-black uppercase tracking-[0.2em] border-2 border-foreground px-6 py-2 rotate-[-12deg]">
                    {statusOverlayLabel(item.status)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-fg-subtle">
                {item.isOwner ? "Your Drop" : `Dropped by @${item.giver.username}`}
              </span>
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground leading-tight mt-1">
                {item.title}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-foreground/5 border border-foreground/10 text-[9px] font-bold uppercase tracking-widest text-fg-soft">
                  {item.category}
                </span>
                <span className="px-3 py-1 bg-foreground/5 border border-foreground/10 text-[9px] font-bold uppercase tracking-widest text-fg-soft">
                  {item.condition}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Contextual Logic */}
          <div className="w-full lg:w-2/3 flex flex-col">

            {/* SCENARIO 1: Receiver won — waiting for giver to ship */}
            {!item.isOwner && item.isWinner ? (
              <div className="p-8 border border-brand-ink/30 bg-brand/5 flex flex-col items-center justify-center text-center rounded-sm mt-8">
                <Trophy className="w-12 h-12 text-brand-ink mb-4" strokeWidth={1.5} />
                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-2">
                  Request Accepted!
                </h2>
                <p className="text-[11px] text-fg-muted font-bold uppercase tracking-widest mb-8 max-w-md leading-relaxed">
                  @{item.giver.username} has accepted your request. Once they dispatch the item you&apos;ll receive a
                  notification here with delivery details.
                </p>
                <button className="bg-foreground text-background px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-foreground/80 transition-colors flex items-center gap-2 rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  <MessageSquare className="w-4 h-4" /> Message @{item.giver.username}
                </button>
              </div>
            ) : item.isOwner ? (

              // SCENARIO 2: Giver — Queue Manager + Fulfillment Center
              <>
                <div className="flex items-end justify-between border-b border-foreground/10 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Live Queue</h2>
                    <p className="text-[10px] text-fg-subtle font-bold uppercase tracking-widest mt-1">
                      {item.requests?.length || 0} users requested this item.
                    </p>
                  </div>
                </div>

                {item.requests?.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center border border-foreground/5 border-dashed rounded-sm">
                    <Users className="w-8 h-8 text-fg-ghost mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-fg-subtle">
                      Queue is empty
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {item.requests?.map((req: any, index: number) => {
                      const isThisAccepted = req.status === "ACCEPTED";
                      const isRejected = req.status === "REJECTED";
                      const swapMatch = req.message?.match(/offering item ([a-zA-Z0-9]+)/);
                      const offeredId = swapMatch ? swapMatch[1] : null;

                      if (isClaimed && isRejected) return null;

                      return (
                        <div
                          key={req.id}
                          className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border transition-all ${
                            isThisAccepted
                              ? "bg-brand/5 border-brand-ink/30"
                              : isRejected
                              ? "bg-transparent border-foreground/5 opacity-50 grayscale"
                              : "bg-card border-foreground/10"
                          }`}
                        >
                          <div className="flex items-start gap-4 flex-grow max-w-full min-w-0">
                            <div className="w-8 h-8 rounded-full bg-surface-3 border border-foreground/20 overflow-hidden shrink-0 flex items-center justify-center">
                              {req.requester.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={req.requester.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-black text-foreground">
                                  {req.requester.username.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-grow min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground uppercase truncate">
                                  @{req.requester.username}
                                </span>
                                <span className="text-[8px] font-black text-fg-faint uppercase tracking-widest bg-foreground/5 px-1.5 py-0.5 rounded-sm shrink-0">
                                  #{index + 1}
                                </span>
                              </div>
                              {offeredId && offeredId !== "undefined" ? (
                                <OfferedItemPreview itemId={offeredId} />
                              ) : req.message ? (
                                <p className="text-[10px] text-fg-muted font-medium mt-1 line-clamp-2">
                                  {req.message}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center self-end md:self-center">
                            {isThisAccepted ? (
                              <div className="flex items-center gap-2 text-brand-ink text-[9px] font-black uppercase tracking-widest bg-brand/10 px-4 py-2 border border-brand-ink/20">
                                <Check className="w-4 h-4" strokeWidth={3} /> Winner Selected
                              </div>
                            ) : isRejected ? (
                              <span className="text-[9px] font-black uppercase tracking-widest text-fg-faint">
                                Rejected
                              </span>
                            ) : isClaimed ? (
                              <span className="text-[9px] font-black uppercase tracking-widest text-fg-faint">
                                Missed Out
                              </span>
                            ) : (
                              <button
                                onClick={() => acceptRequest(req.id)}
                                disabled={processingId !== null}
                                className="bg-foreground text-background px-6 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-foreground/80 transition-colors flex items-center gap-2 outline-none rounded-sm shrink-0 disabled:opacity-50"
                              >
                                {processingId === req.id ? "Processing..." : "Accept Request"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── FULFILLMENT CENTER ── */}
                {isClaimed && acceptedReq && (
                  <div className="mt-8 p-6 border border-foreground/15 bg-card rounded-sm flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 border-b border-foreground/10 pb-4">
                      <PackageOpen className="w-5 h-5 text-brand-ink" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                        Fulfillment Center
                      </h3>
                    </div>

                    {/* ── Receiver Contact Details (visible after ACCEPTED) ── */}
                    {(acceptedReq.receiverPhone || acceptedReq.receiverEmail || acceptedReq.receiverAddress) && (
                      <div className="p-4 border border-foreground/20 bg-background flex flex-col gap-3">
                        <span className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">
                          Receiver Contact Info
                        </span>
                        {acceptedReq.receiverPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest">Phone</span>
                            <span className="text-[11px] font-bold text-foreground">{acceptedReq.receiverPhone}</span>
                          </div>
                        )}
                        {acceptedReq.receiverEmail && (
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest">Email</span>
                            <span className="text-[11px] font-bold text-foreground">{acceptedReq.receiverEmail}</span>
                          </div>
                        )}
                        {acceptedReq.receiverAddress && (
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-[9px] font-bold text-fg-subtle uppercase tracking-widest shrink-0">
                              Address
                            </span>
                            <span className="text-[11px] font-bold text-foreground text-right">
                              {acceptedReq.receiverAddress}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Step 1: Choose delivery method ── */}
                    {!acceptedReq.deliveryMethod && (
                      <div className="flex flex-col gap-4">
                        <p className="text-[10px] text-fg-muted uppercase tracking-widest">
                          Step 1: How are you sending this item?
                        </p>
                        <select
                          value={delMethod}
                          onChange={(e) => setDelMethod(e.target.value)}
                          className="w-full bg-background border border-foreground/10 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-brand-ink"
                        >
                          <option value="PRIVATE_DISPATCH">Local Dispatch Rider / Bike</option>
                          <option value="MEETUP">Face-to-Face Meetup</option>
                          <option value="WAYBILL">Interstate Waybill (Bus Park)</option>
                          <option value="COURIER">Standard Courier (DHL / Sendbox)</option>
                        </select>
                        <button
                          onClick={() =>
                            handleDeliveryAction(
                              "set_delivery_method",
                              { deliveryMethod: delMethod },
                              acceptedReq.id
                            )
                          }
                          disabled={processingId === "delivery"}
                          className="bg-foreground text-background px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:text-black"
                        >
                          {processingId === "delivery" ? "Processing..." : "Confirm Method"}
                        </button>
                      </div>
                    )}

                    {/* ── Step 2: Dispatch with correct per-method fields ── */}
                    {/* FIX #2: each method now sends its own named fields */}
                    {acceptedReq.deliveryStatus === "PENDING_DISPATCH" && (
                      <div className="flex flex-col gap-4">
                        <p className="text-[10px] text-fg-muted uppercase tracking-widest">
                          Step 2: Enter Dispatch Details
                        </p>
                        <DispatchForm
                          method={acceptedReq.deliveryMethod}
                          onSubmit={(payload) =>
                            handleDeliveryAction("mark_dispatched", payload, acceptedReq.id)
                          }
                          loading={processingId === "delivery"}
                        />
                      </div>
                    )}

                    {/* ── Step 3: In Transit ── */}
                    {acceptedReq.deliveryStatus === "IN_TRANSIT" && (
                      <div className="flex flex-col gap-4">
                        <div className="border border-brand-ink/30 bg-brand/5 p-5 flex flex-col gap-4">
                          <p className="text-[10px] text-brand-ink font-bold uppercase tracking-widest text-center">
                            {isOtpMethod
                              ? "Item is in transit. Ask the receiver for their 4-digit Release Code to complete the drop."
                              : "Item is in transit. Waiting for the receiver to confirm delivery."}
                          </p>

                          {/* Show dispatch details summary */}
                          {(acceptedReq.dispatchName || acceptedReq.courierName || acceptedReq.trackingNumber || acceptedReq.parkLocation) && (
                            <div className="border-t border-brand-ink/20 pt-4 flex flex-col gap-2">
                              <span className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">
                                Dispatch Details
                              </span>
                              {acceptedReq.dispatchName && (
                                <div className="flex justify-between">
                                  <span className="text-[9px] text-fg-subtle uppercase tracking-widest">Rider</span>
                                  <span className="text-[10px] font-bold text-foreground">{acceptedReq.dispatchName}</span>
                                </div>
                              )}
                              {acceptedReq.dispatchPhone && (
                                <div className="flex justify-between">
                                  <span className="text-[9px] text-fg-subtle uppercase tracking-widest">Phone</span>
                                  <span className="text-[10px] font-bold text-foreground">{acceptedReq.dispatchPhone}</span>
                                </div>
                              )}
                              {acceptedReq.courierName && (
                                <div className="flex justify-between">
                                  <span className="text-[9px] text-fg-subtle uppercase tracking-widest">Courier</span>
                                  <span className="text-[10px] font-bold text-foreground">{acceptedReq.courierName}</span>
                                </div>
                              )}
                              {acceptedReq.trackingNumber && (
                                <div className="flex justify-between">
                                  <span className="text-[9px] text-fg-subtle uppercase tracking-widest">Tracking</span>
                                  <span className="text-[10px] font-bold text-foreground">{acceptedReq.trackingNumber}</span>
                                </div>
                              )}
                              {acceptedReq.parkLocation && (
                                <div className="flex justify-between">
                                  <span className="text-[9px] text-fg-subtle uppercase tracking-widest">Park</span>
                                  <span className="text-[10px] font-bold text-foreground">{acceptedReq.parkLocation}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* OTP input for MEETUP only */}
                          {isOtpMethod && (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                maxLength={4}
                                placeholder="0 0 0 0"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                                className="w-full bg-background border border-foreground/10 text-foreground text-center text-lg tracking-[0.5em] font-black px-4 py-3 focus:outline-none focus:border-brand-ink"
                              />
                              <button
                                onClick={() =>
                                  handleDeliveryAction("verify_otp", { otp: otpInput }, acceptedReq.id)
                                }
                                disabled={processingId === "delivery" || otpInput.length !== 4}
                                className="bg-foreground text-background px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-foreground/80 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === "delivery" ? "Verifying..." : "Verify"}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dispute button — available to giver during IN_TRANSIT */}
                        {!showDisputeForm ? (
                          <button
                            onClick={() => setShowDisputeForm(true)}
                            className="self-start flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors bg-transparent outline-none border-b border-red-500/30 hover:border-red-400 pb-0.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Raise a Dispute
                          </button>
                        ) : (
                          <div className="flex flex-col gap-3 p-4 border border-red-500/30 bg-red-500/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-400">
                              Describe the issue
                            </span>
                            <textarea
                              rows={3}
                              placeholder="e.g. Item was damaged, rider disappeared, wrong item sent..."
                              value={disputeReason}
                              onChange={(e) => setDisputeReason(e.target.value)}
                              className="w-full bg-background border border-red-500/30 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-red-400 resize-none placeholder:text-fg-faint"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  handleDeliveryAction(
                                    "raise_dispute",
                                    { disputeReason },
                                    acceptedReq.id
                                  )
                                }
                                disabled={!disputeReason.trim() || processingId === "delivery"}
                                className="bg-red-500 text-foreground px-6 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === "delivery" ? "Submitting..." : "Submit Dispute"}
                              </button>
                              <button
                                onClick={() => { setShowDisputeForm(false); setDisputeReason(""); }}
                                className="bg-transparent text-fg-subtle hover:text-foreground px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors outline-none border border-foreground/10"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Delivered ── */}
                    {acceptedReq.deliveryStatus === "DELIVERED" && (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <CheckCircle2 className="w-12 h-12 text-brand-ink" />
                        <h3 className="text-lg font-black uppercase tracking-widest text-foreground">
                          Delivery Complete
                        </h3>
                        <p className="text-[10px] text-fg-muted uppercase tracking-widest text-center max-w-sm">
                          {isConfirmMethod
                            ? "Receiver confirmed delivery of the item."
                            : "OTP successfully verified."}{" "}
                          Transaction is closed.
                        </p>
                      </div>
                    )}

                    {/* ── Disputed ── */}
                    {acceptedReq.deliveryStatus === "DISPUTED" && (
                      <div className="flex flex-col items-center gap-2 py-4 border border-red-500/30 bg-red-500/10 p-5">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-red-500">
                          Delivery Disputed
                        </h3>
                        <p className="text-[10px] text-red-400 uppercase tracking-widest text-center">
                          A dispute has been raised. Our team is investigating.
                        </p>
                        {acceptedReq.disputeReason && (
                          <p className="text-[10px] text-fg-subtle text-center mt-1">
                            &ldquo;{acceptedReq.disputeReason}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // SCENARIO 3: Default fallback (not owner, not winner)
              <div className="py-20 flex flex-col items-center justify-center border border-foreground/5 border-dashed rounded-sm mt-8">
                <PackageOpen className="w-8 h-8 text-fg-ghost mb-3" />
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-subtle">
                  {isClaimed ? "This item has been claimed." : "You do not own this item."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}