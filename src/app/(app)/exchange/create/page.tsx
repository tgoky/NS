"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Info,
  Type,
  Database,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  Check,
  Edit2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";


const CATEGORIES = ["Clothing", "Shoes", "Accessories", "Equipment", "Kitchen", "Other"];
const CONDITIONS = [
  { value: "NEW", label: "Brand New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Pre-Owned" },
  { value: "FAIR", label: "Archival" },
];

type AuthUser = { username: string; fullName: string | null; avatar: string | null };

type AuthenticityResult = {
  flagged: boolean;
  confidence: "high" | "medium" | "low";
  verdict: string;
  issues: string[];
  skipped?: boolean;
};

export default function CreateExchangePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authenticity, setAuthenticity] = useState<AuthenticityResult | null>(null);

  const [exchangeMode, setExchangeMode] = useState<"custom" | "ledger">("custom");
  const [ledgerItems, setLedgerItems] = useState<any[]>([]);

  // Notice dropType is hardcoded to "exchange"
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    category: "Clothing",
    condition: "GOOD",
    size: "",
    imageUrl: "",
    description: "",
    dropType: "exchange",
    seekingDescription: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => { if (json.success) setAuthUser(json.data); })
      .catch(() => {});

    fetch('/api/items')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setLedgerItems(json.data.filter((item: any) => item.status !== 'completed'));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formData.imageUrl) setImageLoaded(false);
  }, [formData.imageUrl]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const runAuthenticityCheck = async (imageUrl: string, brand: string, title: string) => {
    setChecking(true);
    setAuthenticity(null);
    try {
      const res = await fetch("/api/ai/authenticity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, brand, title }),
      });
      const json = await res.json();
      if (json.success) setAuthenticity(json.data);
    } catch {
      // silently skip
    } finally {
      setChecking(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempUrl = URL.createObjectURL(file);
    updateField("imageUrl", tempUrl);
    setAuthenticity(null);

    setUploading(true);
    if (errors.imageUrl) setErrors((prev) => ({ ...prev, imageUrl: "" }));
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();

      if (!json.success) throw new Error(json.error ?? "Upload failed");

      const publicUrl: string = json.data.url;
      updateField("imageUrl", publicUrl);
      runAuthenticityCheck(publicUrl, formData.brand, formData.title);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrors((prev) => ({ ...prev, imageUrl: `Upload failed: ${err?.message ?? "unknown error"}` }));
      updateField("imageUrl", "");
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Asset title is required.";
    if (uploading) newErrors.imageUrl = "Image still uploading, please wait.";
    else if (!formData.imageUrl.trim()) newErrors.imageUrl = "Visual documentation is required.";
    if (!formData.seekingDescription.trim()) newErrors.seekingDescription = "Specify your target exchange item.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowReview(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        isExchange: true,
        images: [formData.imageUrl],
        location: "Global",
      };

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        router.push("/exchange"); // Redirects back to the exchange feed
      } else {
        setShowReview(false);
        setErrors({ submit: json.error?.message || "Failed to process exchange." });
      }
    } catch {
      setShowReview(false);
      setErrors({ submit: "Network disruption. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-full w-full bg-background text-foreground selection:bg-brand selection:text-black flex flex-col lg:flex-row overflow-hidden`}>

      {/* LEFT COLUMN: LIVE REACTIVE PREVIEW */}
      <div className="w-full lg:w-1/2 h-[45vh] lg:h-[calc(100dvh-3rem)] sticky top-0 bg-background border-b lg:border-b-0 lg:border-r border-foreground/10 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23FFFFFF' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

        <div className={`absolute inset-0 transition-opacity duration-1000 ease-out bg-background ${formData.imageUrl ? "opacity-100" : "opacity-0"}`}>
          {formData.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formData.imageUrl}
              alt="Asset Preview"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-1000 ease-out ${imageLoaded ? 'scale-100 blur-0' : 'scale-105 blur-xl'}`}
            />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 lg:p-16 z-10 flex flex-col justify-end">
          <div className="flex flex-wrap items-center gap-2 mb-6 transition-all duration-500">
            <span className="bg-surface-2/90 backdrop-blur-md px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-brand-ink border border-brand-ink/30 rounded-sm flex items-center gap-2 shadow-xl">
              <ArrowLeftRight className="w-3 h-3" /> Exchange
            </span>
            <span className="bg-surface-2/90 backdrop-blur-md px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-fg-muted rounded-sm shadow-xl">
              {formData.category}
            </span>
            {formData.size && (
              <span className="bg-surface-2/90 backdrop-blur-md px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-brand-ink rounded-sm shadow-xl">
                SZ {formData.size}
              </span>
            )}
          </div>

          <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-fg-muted mb-2 transition-all duration-300">
            {formData.brand || "Mkr. Unknown"}
          </h2>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] break-words">
            {formData.title ? (
              <span className="text-foreground drop-shadow-2xl">{formData.title}</span>
            ) : (
              <span className="text-fg-ghost animate-pulse select-none">OFFERING ASSET</span>
            )}
          </h1>

          {formData.seekingDescription && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl">
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-ink mb-2">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Target Asset
              </span>
              <p className="text-xl md:text-2xl font-black uppercase tracking-tighter text-foreground leading-none drop-shadow-lg">
                {formData.seekingDescription}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: EDITORIAL FORM */}
      <div className="w-full lg:w-1/2 h-full lg:h-[calc(100dvh-3rem)] overflow-y-auto no-scrollbar bg-background">
        <div className="p-6 md:p-12 lg:p-20 max-w-2xl mx-auto">

          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => router.push("/exchange")}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-fg-subtle hover:text-foreground transition-colors outline-none bg-transparent border-none p-0"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Return to Exchange
            </button>

            {authUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 border border-foreground/[0.07] bg-foreground/[0.02]">
                <div className="w-5 h-5 rounded-full bg-surface-3 border border-foreground/20 flex items-center justify-center overflow-hidden shrink-0">
                  {authUser.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={authUser.avatar} alt={authUser.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[7px] font-black text-foreground">
                      {(authUser.fullName ?? authUser.username).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-fg-subtle">
                  Posting as <span className="text-fg-soft">@{authUser.username}</span>
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-16">

            {/* 1. TARGET ASSET */}
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-subtle block border-b border-foreground/10 pb-2">
                1. Target Asset (What you are seeking)
              </label>

              <div className="pt-2 pb-2 space-y-6">
                <div className="inline-flex bg-surface-2/50 p-1 rounded-sm w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setExchangeMode("custom")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all outline-none rounded-sm ${
                      exchangeMode === "custom"
                        ? "bg-background text-brand-ink shadow-sm"
                        : "text-fg-subtle hover:text-fg-soft"
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" /> Custom
                  </button>
                  <button
                    type="button"
                    onClick={() => setExchangeMode("ledger")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all outline-none rounded-sm ${
                      exchangeMode === "ledger"
                        ? "bg-background text-brand-ink shadow-sm"
                        : "text-fg-subtle hover:text-fg-soft"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" /> Ledger
                  </button>
                </div>

                {exchangeMode === "custom" ? (
                  <div>
                    <input
                      type="text"
                      placeholder="WHAT ASSET ARE YOU SEEKING?"
                      value={formData.seekingDescription}
                      onChange={(e) => updateField("seekingDescription", e.target.value)}
                      className={`w-full bg-transparent border-b-2 px-0 py-4 text-sm md:text-lg font-bold text-foreground transition-all outline-none placeholder:text-fg-ghost ${
                        errors.seekingDescription ? "border-red-500" : "border-foreground/15 focus:border-brand-ink"
                      }`}
                    />
                    {errors.seekingDescription && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-2">{errors.seekingDescription}</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ledgerItems.length === 0 ? (
                      <p className="text-[10px] text-fg-subtle uppercase tracking-widest py-4">No active assets available on the ledger.</p>
                    ) : (
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                        {ledgerItems.map(item => {
                          const isSelected = formData.seekingDescription === item.title;
                          return (
                            <div
                              key={item.id}
                              onClick={() => updateField("seekingDescription", item.title)}
                              className={`w-32 shrink-0 snap-start cursor-pointer transition-all duration-300 group ${
                                isSelected ? "opacity-100 scale-100" : "opacity-40 hover:opacity-80 scale-95 hover:scale-100"
                              }`}
                            >
                              <div className={`w-full aspect-[4/5] bg-surface-2 overflow-hidden mb-3 border transition-colors rounded-sm ${isSelected ? "border-brand-ink" : "border-transparent"}`}>
                                {item.imageUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <h4 className={`text-[9px] font-black uppercase tracking-widest truncate ${isSelected ? "text-brand-ink" : "text-foreground"}`}>
                                {item.title}
                              </h4>
                              <p className="text-[8px] font-bold uppercase tracking-widest text-fg-faint truncate mt-0.5">
                                @{item.user}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {formData.seekingDescription && exchangeMode === 'ledger' && (
                      <div className="bg-surface-2 border border-foreground/15 px-5 py-4 flex items-center justify-between rounded-sm">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-ink">Target Locked</span>
                        <span className="text-[10px] font-bold text-foreground uppercase truncate ml-4 max-w-[200px]">{formData.seekingDescription}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. ASSET TITLE */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground border-b border-foreground/10 pb-2">
                <Type className="w-4 h-4 text-fg-subtle" /> 2. Asset Name (What you are offering)
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="TYPE ASSET TITLE HERE..."
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={`w-full bg-transparent border-b-2 px-0 py-6 text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground transition-all outline-none placeholder:text-fg-ghost ${
                    errors.title ? "border-red-500 focus:border-red-400" : "border-foreground/15 focus:border-foreground"
                  }`}
                />
                {errors.title && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{errors.title}</p>}
              </div>
            </div>

            {/* 3. VISUALS */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground border-b border-foreground/10 pb-2">
                <ImageIcon className="w-4 h-4 text-fg-subtle" /> 3. Visual Upload
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className={`relative flex flex-col items-center justify-center border border-dashed transition-all h-28 rounded-sm group ${uploading ? "bg-surface-2 border-brand-ink/40 cursor-wait" : "bg-surface-2/30 hover:bg-surface-2 border-foreground/15 hover:border-brand-ink/50 cursor-pointer"}`}>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 text-brand-ink mb-2 animate-spin" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand-ink">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5 text-fg-faint group-hover:text-brand-ink mb-2 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-fg-subtle group-hover:text-foreground transition-colors">Select Local File</span>
                    </>
                  )}
                </label>

                <div className="flex flex-col justify-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-fg-ghost mb-2">OR PASTE URL</span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => updateField("imageUrl", e.target.value)}
                    className={`w-full bg-transparent border-b px-0 py-2 text-xs font-bold text-foreground transition-all outline-none placeholder:text-fg-ghost ${
                      errors.imageUrl ? "border-red-500 focus:border-red-400" : "border-foreground/15 focus:border-brand-ink"
                    }`}
                  />
                </div>
              </div>
              {errors.imageUrl && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">{errors.imageUrl}</p>}

              {/* Authenticity Badge */}
              {checking && (
                <div className="flex items-center gap-2 px-3 py-2 border border-foreground/15 bg-surface-2/50 w-fit">
                  <Loader2 className="w-3 h-3 animate-spin text-fg-subtle" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-fg-subtle">Running Auth Check...</span>
                </div>
              )}
              {!checking && authenticity && !authenticity.skipped && (
                <div className={`flex flex-col gap-1.5 px-4 py-3 border w-full ${
                  authenticity.flagged
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-brand-ink/30 bg-brand/5"
                }`}>
                  <div className="flex items-center gap-2">
                    {authenticity.flagged ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2} />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-ink shrink-0" strokeWidth={2} />
                    )}
                    <span className={`text-[9px] font-black uppercase tracking-widest ${authenticity.flagged ? "text-amber-400" : "text-brand-ink"}`}>
                      {authenticity.flagged ? "Review Recommended" : "Looks Authentic"}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-fg-faint ml-auto">
                      {authenticity.confidence} confidence
                    </span>
                  </div>
                  <p className="text-[9px] text-fg-muted font-medium leading-relaxed">{authenticity.verdict}</p>
                </div>
              )}
            </div>

            {/* 4. DETAILS */}
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground block border-b border-foreground/10 pb-2">
                4. Taxonomy & Grade
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <input
                  type="text"
                  placeholder="Brand / Maker (Optional)"
                  value={formData.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  className="w-full bg-transparent border-b border-foreground/15 px-0 py-3 text-xs font-bold text-foreground transition-all outline-none focus:border-foreground placeholder:text-fg-ghost"
                />
                <input
                  type="text"
                  placeholder="Size (e.g. M, 32, OS)"
                  value={formData.size}
                  onChange={(e) => updateField("size", e.target.value)}
                  className="w-full bg-transparent border-b border-foreground/15 px-0 py-3 text-xs font-bold text-foreground transition-all outline-none focus:border-foreground placeholder:text-fg-ghost"
                />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-fg-faint block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full bg-card border border-foreground/10 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground transition-all outline-none focus:border-foreground cursor-pointer appearance-none rounded-sm"
                  >
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-fg-faint block">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => updateField("condition", e.target.value)}
                    className="w-full bg-card border border-foreground/10 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground transition-all outline-none focus:border-foreground cursor-pointer appearance-none rounded-sm"
                  >
                    {CONDITIONS.map((cond) => <option key={cond.value} value={cond.value}>{cond.label}</option>)}
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Curation Notes: Describe the history, measurements, or flaws..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full bg-transparent border-b border-foreground/15 px-0 py-4 text-xs font-medium text-foreground transition-all outline-none focus:border-foreground placeholder:text-fg-ghost resize-none mt-2"
              />
            </div>

            {errors.submit && (
              <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                <Info className="w-4 h-4" /> SYS_ERR: {errors.submit}
              </div>
            )}

            <div className="pt-8 pb-12">
              <button
                type="submit"
                disabled={submitting || uploading}
                className={`
                  w-full py-6 flex items-center justify-center gap-3 cursor-pointer
                  transition-all duration-200 ease-out border rounded-sm
                  ${submitting || uploading
                    ? "bg-card text-fg-faint border-foreground/10 cursor-not-allowed"
                    : "bg-brand text-black border-brand-ink hover:bg-brand/90 active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,178,0.2)]"
                  }
                `}
              >
                <span className="text-[12px] font-black uppercase tracking-[0.25em]">
                  {uploading ? "Uploading Image..." : submitting ? "Processing Ledger..." : "Post Exchange"}
                </span>
                {!submitting && !uploading && <ArrowRight className="w-5 h-5" strokeWidth={2.5} />}
                {(submitting || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ── REVIEW OVERLAY ── */}
      {showReview && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className={`w-full max-w-lg bg-card border border-foreground/10 flex flex-col`}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/10">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-fg-subtle mb-0.5">Step 2 of 2</p>
                <h2 className="text-sm font-black uppercase tracking-tight text-foreground">Review Your Exchange</h2>
              </div>
              <div className="w-6 h-6 rounded-full border border-brand-ink/40 flex items-center justify-center">
                <Check className="w-3 h-3 text-brand-ink" strokeWidth={3} />
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 flex gap-5">
              {formData.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover border border-foreground/10 shrink-0"
                />
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <span className={`text-[8px] font-black uppercase tracking-[0.25em] text-brand-ink`}>
                  ⇌ Exchange Listing
                </span>
                <h3 className="text-base font-black uppercase tracking-tighter text-foreground leading-tight truncate">
                  {formData.title}
                </h3>
                {formData.brand && (
                  <p className="text-[9px] font-bold uppercase tracking-widest text-fg-subtle truncate">{formData.brand}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-fg-faint">{formData.category}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-fg-faint">
                    {CONDITIONS.find(c => c.value === formData.condition)?.label}
                  </span>
                  {formData.size && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-fg-faint">Sz {formData.size}</span>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-foreground/5">
                  <span className="text-[7px] font-black uppercase tracking-widest text-fg-faint">Seeking</span>
                  <p className="text-[10px] font-bold uppercase text-brand-ink line-clamp-1">{formData.seekingDescription}</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-2">
              <div className="h-px bg-foreground/5" />
            </div>

            <div className="px-6 py-3 flex items-center justify-between">
              <p className="text-[9px] text-fg-faint font-bold uppercase tracking-widest">
                Goes live on the exchange ledger immediately.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={() => setShowReview(false)}
                disabled={submitting}
                className="flex-1 py-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-fg-muted border border-foreground/10 hover:text-foreground hover:border-foreground/30 transition-all outline-none disabled:opacity-40"
              >
                <Edit2 className="w-3 h-3" strokeWidth={2} /> Edit
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className={`flex-[2] py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all outline-none ${
                  submitting
                    ? "bg-brand/40 text-black/50 cursor-not-allowed"
                    : "bg-brand text-black hover:bg-brand/90 active:scale-[0.98] shadow-[0_0_20px_rgba(0,255,178,0.2)]"
                }`}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Check className="w-4 h-4" strokeWidth={2.5} /> Confirm & Publish</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}