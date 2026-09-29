"use client";

/**
 * RECEIVER DELIVERY PAGE
 * Route: /my-requests/delivery/[requestId]
 *
 * FIX #3: This page was entirely missing. It covers the full receiver-side
 * delivery experience:
 *   - Path A (PRIVATE_DISPATCH / WAYBILL / COURIER): sees dispatch details,
 *     clicks "Confirm Receipt" to complete the transaction.
 *   - Path B (MEETUP): sees the giant 4-digit OTP and verbally tells it to
 *     the giver. No button needed — giver enters it on their side.
 *   - Either path: can raise a dispute while IN_TRANSIT.
 *
 * Wire this page up at:  src/app/my-requests/delivery/[requestId]/page.tsx
 *
 * The "Your item is in transit" notification from the giver's mark_dispatched
 * action should link to:  /my-requests/delivery/<requestId>
 */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  PackageOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Truck,
  Phone,
  MapPin,
  Hash,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";


// ─── Delivery method label ─────────────────────────────────────────────────────
function methodLabel(method: string) {
  const map: Record<string, string> = {
    PRIVATE_DISPATCH: "Local Dispatch Rider",
    MEETUP: "Face-to-Face Meetup",
    WAYBILL: "Bus Park Waybill",
    COURIER: "Courier Service",
  };
  return map[method] || method;
}

// ─── OTP Display — the giant code the receiver sees ───────────────────────────
function OtpDisplay({ otp }: { otp: string }) {
  const digits = otp.split("");
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5 text-brand-ink" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-ink">
          Your Release Code
        </span>
      </div>

      {/* Giant digits */}
      <div className="flex items-center gap-4">
        {digits.map((d, i) => (
          <div
            key={i}
            className="w-16 h-20 md:w-20 md:h-24 bg-card border-2 border-brand-ink/60 flex items-center justify-center shadow-[0_0_24px_rgba(0,255,178,0.15)]"
          >
            <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter select-all">
              {d}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest text-center max-w-xs leading-relaxed">
        Show or read this code to the giver when you&apos;re satisfied with the item.
        Do not share it until you&apos;ve physically inspected what was handed to you.
      </p>
    </div>
  );
}

// ─── Dispatch details summary for the receiver to track their package ─────────
function DispatchSummary({ req }: { req: any }) {
  const rows: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (req.dispatchName)
    rows.push({ icon: <Phone className="w-3.5 h-3.5" />, label: "Rider / Contact", value: req.dispatchName });
  if (req.dispatchPhone)
    rows.push({ icon: <Phone className="w-3.5 h-3.5" />, label: "Phone", value: req.dispatchPhone });
  if (req.courierName)
    rows.push({ icon: <Building2 className="w-3.5 h-3.5" />, label: "Courier", value: req.courierName });
  if (req.trackingNumber)
    rows.push({ icon: <Hash className="w-3.5 h-3.5" />, label: "Tracking No.", value: req.trackingNumber });
  if (req.parkLocation)
    rows.push({ icon: <MapPin className="w-3.5 h-3.5" />, label: "Bus Park", value: req.parkLocation });

  if (rows.length === 0) return null;

  return (
    <div className="p-4 border border-foreground/10 bg-background flex flex-col gap-3">
      <span className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">
        Delivery Details
      </span>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-fg-subtle shrink-0">
            {row.icon}
            <span className="text-[9px] font-bold uppercase tracking-widest">{row.label}</span>
          </div>
          <span className="text-[11px] font-bold text-foreground text-right">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReceiverDeliveryPage() {
  const params = useParams();
  const requestId = params?.requestId as string;
  const router = useRouter();

  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const fetchDelivery = async () => {
    if (!requestId || requestId === "undefined") return;
    try {
      const res = await fetch(`/api/delivery?requestId=${requestId}`);
      const json = await res.json();
      if (json.success) setDeliveryData(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
    // Poll every 15s so status updates from the giver appear without a manual refresh
    const interval = setInterval(fetchDelivery, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const handleAction = async (action: string, payload: any = {}) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requestId, ...payload }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchDelivery();
        setShowDisputeForm(false);
        setDisputeReason("");
      } else {
        alert(json.error?.message || "Action failed");
      }
    } finally {
      setProcessing(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────────
  if (!requestId || requestId === "undefined" || loading) {
    return <div className="min-h-full bg-background" />;
  }

  if (!deliveryData) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center text-foreground">
        <div className="flex flex-col items-center gap-3">
          <PackageOpen className="w-10 h-10 text-fg-ghost" strokeWidth={1} />
          <p className="text-[10px] font-black uppercase tracking-widest text-fg-subtle">
            Delivery not found.
          </p>
        </div>
      </div>
    );
  }

  const { deliveryStatus, deliveryMethod, deliveryOtp, item } = deliveryData;
  const isMeetup = deliveryMethod === "MEETUP";
  const isConfirmPath = ["PRIVATE_DISPATCH", "WAYBILL", "COURIER"].includes(deliveryMethod);

  return (
    <div className={`min-h-full bg-background text-foreground`}>
      <div className="max-w-[600px] mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-subtle hover:text-foreground transition-colors mb-8 outline-none bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-card border border-foreground/10 overflow-hidden shrink-0">
              {item?.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PackageOpen className="w-6 h-6 text-fg-ghost" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-fg-faint mb-1">
                Delivery Status
              </span>
              <h1 className="text-xl font-black uppercase tracking-tight text-foreground leading-tight">
                {item?.title || "Your Item"}
              </h1>
              <span className="text-[9px] font-bold uppercase tracking-widest text-fg-subtle mt-1">
                via {methodLabel(deliveryMethod || "")}
              </span>
            </div>
          </div>
        </div>

        {/* ── PENDING_DISPATCH: Giver hasn't sent it yet ── */}
        {deliveryStatus === "PENDING_DISPATCH" && (
          <div className="p-6 border border-foreground/15 bg-card flex flex-col items-center gap-4 text-center">
            <Clock className="w-10 h-10 text-fg-faint" strokeWidth={1.5} />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              Awaiting Dispatch
            </h2>
            <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest leading-relaxed max-w-xs">
              @{item?.giver?.username || "the giver"} has confirmed the delivery method.
              This page will update automatically once the item is dispatched.
            </p>
          </div>
        )}

        {/* ── IN_TRANSIT: The item is on its way ── */}
        {deliveryStatus === "IN_TRANSIT" && (
          <div className="flex flex-col gap-6">

            {/* Transit banner */}
            <div className="flex items-center gap-3 p-4 border border-brand-ink/30 bg-brand/5">
              <Truck className="w-5 h-5 text-brand-ink shrink-0" />
              <p className="text-[10px] text-brand-ink font-bold uppercase tracking-widest">
                {isMeetup
                  ? "Your meetup is arranged. See your release code below."
                  : "Your item is on its way. Confirm receipt when it arrives."}
              </p>
            </div>

            {/* Dispatch details for the receiver to track */}
            <DispatchSummary req={deliveryData} />

            {/* Path B: MEETUP — show giant OTP */}
            {isMeetup && deliveryOtp && (
              <div className="border border-foreground/10 bg-card">
                <OtpDisplay otp={deliveryOtp} />
              </div>
            )}

            {/* Path A: Confirm receipt button */}
            {isConfirmPath && (
              <div className="flex flex-col gap-3 p-5 border border-foreground/10 bg-card">
                <span className="text-[9px] font-black uppercase tracking-widest text-fg-muted">
                  Have you received and inspected the item?
                </span>
                <button
                  onClick={() => handleAction("receiver_confirm")}
                  disabled={processing}
                  className="w-full bg-brand text-black py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:text-background"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {processing ? "Confirming..." : "Confirm Receipt"}
                </button>
                <p className="text-[9px] text-fg-faint font-bold uppercase tracking-widest text-center">
                  Only tap this after you physically have the item in your hands.
                </p>
              </div>
            )}

            {/* Dispute — available to receiver during IN_TRANSIT */}
            <div className="flex flex-col gap-3">
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
                    placeholder="e.g. Item was damaged, wrong item, rider never arrived..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full bg-background border border-red-500/30 text-foreground text-[10px] font-bold px-4 py-3 focus:outline-none focus:border-red-400 resize-none placeholder:text-fg-faint"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction("raise_dispute", { disputeReason })}
                      disabled={!disputeReason.trim() || processing}
                      className="bg-red-500 text-foreground px-6 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? "Submitting..." : "Submit Dispute"}
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
          </div>
        )}

        {/* ── DELIVERED ── */}
        {deliveryStatus === "DELIVERED" && (
          <div className="flex flex-col items-center gap-4 py-12 border border-brand-ink/20 bg-brand/5">
            <CheckCircle2 className="w-14 h-14 text-brand-ink" strokeWidth={1.5} />
            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
              Delivery Complete
            </h2>
            <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest text-center max-w-xs leading-relaxed">
              {isMeetup
                ? "The giver verified your release code. Transaction is closed."
                : "You confirmed receipt. Transaction is closed."}
            </p>
          </div>
        )}

        {/* ── DISPUTED ── */}
        {deliveryStatus === "DISPUTED" && (
          <div className="flex flex-col items-center gap-4 py-12 border border-red-500/30 bg-red-500/10">
            <AlertCircle className="w-14 h-14 text-red-500" strokeWidth={1.5} />
            <h2 className="text-2xl font-black uppercase tracking-tighter text-red-500">
              Dispute Open
            </h2>
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center max-w-xs leading-relaxed">
              A dispute has been raised on this transaction. Our team is reviewing
              and will be in touch with both parties.
            </p>
            {deliveryData.disputeReason && (
              <p className="text-[10px] text-fg-subtle text-center mt-1 max-w-xs">
                &ldquo;{deliveryData.disputeReason}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* ── No delivery method set yet (just accepted, giver hasn't acted) ── */}
        {!deliveryStatus && !deliveryMethod && (
          <div className="p-6 border border-foreground/15 bg-card flex flex-col items-center gap-4 text-center">
            <Clock className="w-10 h-10 text-fg-faint" strokeWidth={1.5} />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              Request Accepted
            </h2>
            <p className="text-[10px] text-fg-muted font-bold uppercase tracking-widest leading-relaxed max-w-xs">
              @{item?.giver?.username || "the giver"} has accepted your request and is
              setting up the delivery method. Check back shortly.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}