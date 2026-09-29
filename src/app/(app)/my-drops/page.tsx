"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  Plus, Users, Edit2, Trash2, ArrowLeftRight, PackageOpen, ArrowUpRight,
  LayoutGrid, Zap, Clock, CheckCircle2
} from "lucide-react";


type Drop = {
  id: string;
  brand: string;
  title: string;
  imageUrl: string;
  date: string;
  status: 'active' | 'pending' | 'completed';
  queueCount: number;
  swapOffers: number;
};

export default function MyDropsPage() {
  const router = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/items?mine=true')
      .then((r) => r.json())
      .then((json) => { if (json.success) setDrops(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrops((prev) => prev.filter((d) => d.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDrops = activeTab === "all"
    ? drops
    : drops.filter((drop) => drop.status === activeTab);

  const totalQueue = drops
    .filter((d) => d.status !== 'completed')
    .reduce((sum, d) => sum + d.queueCount, 0);

  const completedCount = drops.filter((d) => d.status === 'completed').length;

  const tabs = [
    { id: 'all', label: 'All Items', icon: LayoutGrid },
    { id: 'active', label: 'Active', icon: Zap },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  return (
    <div className={`min-h-full bg-background text-foreground selection:bg-surface-3 selection:text-foreground pb-32`}>
      <div className="max-w-[1200px] mx-auto px-6 pt-2 pb-12 flex flex-col gap-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between gap-6 md:items-end pb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Personal Ledger
              </h1>
            </div>
            <p className="text-sm text-fg-muted max-w-xl">
              An inventory of your contributions to the ecosystem. Manage active drops, review trade proposals, and log new items.
            </p>
          </div>

          <button
            onClick={() => router.push('/my-drops/create')}
            className="group relative px-5 py-2.5 bg-surface-2 border border-foreground/15 text-fg-soft text-sm font-semibold rounded-lg hover:text-foreground hover:border-foreground/30 hover:bg-surface-3/80 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-fg-subtle group-hover:text-foreground transition-colors" strokeWidth={2} />
            Log new drop
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-center bg-surface-2/50 border border-foreground/50 rounded-xl p-5">
            <span className="text-sm font-medium text-fg-muted mb-1">Total logged</span>
            <span className="text-3xl font-semibold text-foreground">{loading ? '—' : drops.length}</span>
          </div>
          <div className="flex flex-col justify-center bg-surface-2/50 border border-foreground/50 rounded-xl p-5">
            <span className="text-sm font-medium text-fg-muted mb-1">Active queue</span>
            <span className="text-3xl font-semibold text-foreground">{loading ? '—' : totalQueue}</span>
          </div>
          <div className="flex flex-col justify-center bg-surface-2/50 border border-foreground/50 rounded-xl p-5">
            <span className="text-sm font-medium text-fg-muted mb-1">Swaps executed</span>
            <span className="text-3xl font-semibold text-foreground">{loading ? '—' : completedCount}</span>
          </div>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center w-full overflow-x-auto pb-2 -mb-2">
          <div className="inline-flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-foreground/15">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none border-none ${
                    isActive
                      ? "bg-surface-3 text-foreground shadow-sm"
                      : "bg-transparent text-fg-muted hover:text-fg-soft hover:bg-surface-3/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-foreground" : "text-fg-subtle"}`} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Section */}
        <div className="flex flex-col mt-4">
          <div className="hidden md:flex items-center gap-6 px-4 pb-3 text-xs font-medium text-fg-subtle">
            <div className="w-24 shrink-0">Date logged</div>
            <div className="flex-grow">Item details</div>
            <div className="w-32 shrink-0">Status</div>
            <div className="w-32 shrink-0">Activity</div>
            <div className="w-32 shrink-0 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 p-4 rounded-xl border border-foreground/30 bg-surface-2/20">
                  <div className="w-20 h-4 bg-surface-3 rounded animate-pulse" />
                  <div className="flex-grow flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-3 rounded-lg animate-pulse" />
                    <div className="flex flex-col gap-2">
                      <div className="w-16 h-3 bg-surface-3 rounded animate-pulse" />
                      <div className="w-32 h-4 bg-surface-3 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredDrops.map((item) => {
                const isActive = item.status === "active";
                const isPending = item.status === "pending";
                const isCompleted = item.status === "completed";
                const isDeleting = deletingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 rounded-xl border border-transparent hover:border-foreground/50 hover:bg-surface-2/30 transition-all ${
                      isCompleted ? "opacity-60 grayscale hover:grayscale-0" : ""
                    } ${isDeleting ? "opacity-30 pointer-events-none" : ""}`}
                  >
                    <div className="w-24 shrink-0 text-sm text-fg-muted">
                      {item.date}
                    </div>

                    <div className="flex-grow flex items-center gap-4 min-w-0">
                      {/* 
                        FIX: Replaced next/image <Image> with a plain <img> tag.
                        The Next.js image optimizer was making a server-side fetch to
                        Supabase that timed out (500 after 9s). Since your remotePatterns
                        config is already correct, the issue is a network-level timeout
                        between your Next.js server and Supabase. Using a plain <img>
                        serves the image directly from Supabase CDN to the browser,
                        bypassing the optimizer entirely.
                      */}
                      <div className="relative w-12 h-12 shrink-0 bg-surface-2 border border-foreground/15 overflow-hidden rounded-lg">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-fg-subtle mb-0.5 truncate">
                          {item.brand || '—'}
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate">
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <div className="w-32 shrink-0 flex items-center">
                      {isActive && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Pending
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Swapped
                        </span>
                      )}
                    </div>

                    <div className="w-32 shrink-0 flex items-center gap-4">
                      {!isCompleted ? (
                        <>
                          <div className="flex items-center gap-1.5 text-fg-muted" title="Queue Count">
                            <Users className="w-4 h-4" strokeWidth={2} />
                            <span className="text-sm font-medium">{item.queueCount}</span>
                          </div>
                          {item.swapOffers > 0 && (
                            <div className="flex items-center gap-1.5 text-foreground" title="Swap Offers">
                              <ArrowLeftRight className="w-4 h-4" strokeWidth={2} />
                              <span className="text-sm font-medium">{item.swapOffers}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-medium text-fg-subtle">Locked</span>
                      )}
                    </div>

                    <div className="w-32 shrink-0 flex items-center md:justify-end gap-1">
                      {!isCompleted ? (
                        <>
                          <button
                            className="p-2.5 text-fg-muted hover:text-foreground hover:bg-surface-3 rounded-lg transition-colors outline-none bg-transparent border-none"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting}
                            className="p-2.5 text-fg-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors outline-none bg-transparent border-none"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            className="p-2.5 text-fg-muted hover:text-background hover:bg-foreground/90 rounded-lg transition-colors outline-none bg-transparent border-none ml-1"
                            title="Manage Item"
                          >
                            <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </>
                      ) : (
                        <button className="text-sm font-medium text-fg-muted hover:text-foreground transition-colors outline-none bg-transparent border-none">
                          View log
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredDrops.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center border border-foreground/15 border-dashed rounded-xl bg-surface-2/20 mt-4">
              <PackageOpen className="w-8 h-8 text-fg-faint mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-fg-soft mb-1">No records found</h3>
              <p className="text-sm text-fg-subtle">There are no items in this ledger category.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}