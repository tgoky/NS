"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Calendar,
  ArrowLeftRight,
  Gift,
  PackageOpen,
  Users,
  Edit2,
  ArrowUpRight,
} from "lucide-react";


type UserProfile = {
  id: string;
  username: string;
  fullName: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  email: string;
  role: string;
  createdAt: string;
  preferredCategories: string[];
};

type Item = {
  id: string;
  title: string;
  brand: string;
  category: string;
  imageUrl: string;
  condition: string;
  size: string;
  status: string;
  queueCount: number;
  isExchange: boolean;
  seeking: string;
  date: string;
};

const statusColors: Record<string, string> = {
  active: "text-brand-ink",
  pending: "text-[#FF4E00]",
  completed: "text-fg-faint",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  completed: "Swapped",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/items?mine=true").then((r) => r.json()),
    ])
      .then(([meJson, itemsJson]) => {
        if (meJson.success) setProfile(meJson.data);
        if (itemsJson.success) setItems(itemsJson.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredItems =
    activeTab === "all"
      ? items
      : activeTab === "active"
      ? items.filter((i) => i.status === "active" || i.status === "pending")
      : items.filter((i) => i.status === "completed");

  const activeCount = items.filter((i) => i.status === "active").length;
  const completedCount = items.filter((i) => i.status === "completed").length;
  const exchangeCount = items.filter((i) => i.isExchange).length;

  const joinedYear = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null;

  const initials = profile
    ? (profile.fullName ?? profile.username).slice(0, 2).toUpperCase()
    : "";

  return (
    <div
      className={`min-h-full bg-background text-foreground selection:bg-brand selection:text-black pb-32`}
    >
      <div className="max-w-[1200px] mx-auto px-6 pt-8 flex flex-col gap-8">

        {/* ── Profile Card ── */}
        {loading ? (
          <div className="flex gap-6 items-start border-b border-foreground/[0.08] pb-8 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-surface-3 shrink-0" />
            <div className="flex flex-col gap-3 flex-grow pt-2">
              <div className="h-5 w-40 bg-surface-3" />
              <div className="h-3 w-24 bg-surface-3" />
              <div className="h-3 w-64 bg-surface-3 mt-1" />
            </div>
          </div>
        ) : profile ? (
          <div className="flex flex-col md:flex-row gap-6 md:items-start border-b border-foreground/[0.08] pb-8">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full border border-foreground/20 bg-surface-3 shrink-0 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-foreground">{initials}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-2 flex-grow min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-foreground leading-none">
                    {profile.fullName || profile.username}
                  </h1>
                  <p className="text-[11px] font-bold text-fg-subtle tracking-widest mt-1">
                    @{profile.username}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/settings")}
                  className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-fg-subtle border border-foreground/10 px-3 py-2 hover:text-foreground hover:border-foreground/30 transition-all shrink-0 outline-none"
                >
                  <Edit2 className="w-3 h-3" strokeWidth={2} /> Edit
                </button>
              </div>

              {profile.bio && (
                <p className="text-[11px] text-fg-muted font-medium max-w-xl leading-relaxed mt-1">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-2">
                {profile.location && (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-fg-faint">
                    <MapPin className="w-3 h-3" strokeWidth={2} /> {profile.location}
                  </span>
                )}
                {joinedYear && (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-fg-faint">
                    <Calendar className="w-3 h-3" strokeWidth={2} /> Since {joinedYear}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-fg-faint">
                  <User className="w-3 h-3" strokeWidth={2} /> {profile.role}
                </span>
              </div>

              {profile.preferredCategories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.preferredCategories.map((cat) => (
                    <span key={cat} className="px-3 py-1 text-[8px] font-black uppercase tracking-widest text-fg-subtle border border-foreground/[0.07] bg-foreground/[0.02]">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-px bg-foreground/[0.06] border border-foreground/[0.06]">
          {[
            { label: "Total Listed", value: items.length },
            { label: "Active Drops", value: activeCount },
            { label: "Swaps Done", value: completedCount },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col justify-center bg-background p-5">
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-fg-faint mb-1">{label}</span>
              <span className="text-3xl font-black text-foreground">{loading ? "—" : value}</span>
            </div>
          ))}
        </div>

        {/* ── Listings ── */}
        <div className="flex flex-col gap-4">

          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-foreground/[0.07] pb-0">
            <div className="flex items-center gap-0">
              {(["all", "active", "completed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-colors outline-none relative ${
                    activeTab === tab ? "text-foreground" : "text-fg-faint hover:text-fg-muted"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "active" ? "Active" : "Completed"}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-px bg-foreground" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest text-fg-faint pb-2">
              {exchangeCount > 0 && (
                <span className="flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3" strokeWidth={2} /> {exchangeCount} Exchange{exchangeCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border border-foreground/5 animate-pulse">
                  <div className="w-full aspect-[4/5] bg-surface-2" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="h-2.5 w-16 bg-surface-3" />
                    <div className="h-4 w-3/4 bg-surface-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border border-foreground/5 border-dashed gap-4">
              <PackageOpen className="w-8 h-8 text-fg-ghost" strokeWidth={1} />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-fg-faint">
                {activeTab === "all" ? "No listings yet" : `No ${activeTab} listings`}
              </h3>
              {activeTab === "all" && (
                <button
                  onClick={() => router.push("/list-stuffs/create")}
                  className="text-[9px] font-black uppercase tracking-widest text-black bg-brand px-5 py-2.5 flex items-center gap-2 hover:bg-brand/90 transition-all"
                >
                  <Gift className="w-3.5 h-3.5" strokeWidth={2.5} /> Drop Your First Item
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/list-stuffs/show/${item.id}`)}
                  className="group flex flex-col bg-background border border-foreground/10 hover:border-foreground/30 transition-all duration-300 cursor-pointer"
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
                    <div className="absolute top-2 left-2">
                      {item.isExchange ? (
                        <span className="bg-background/80 backdrop-blur-md px-2 py-1 text-[7px] font-black tracking-widest uppercase text-brand-ink border border-brand-ink/30 flex items-center gap-1">
                          <ArrowLeftRight className="w-2.5 h-2.5" strokeWidth={2} /> Exchange
                        </span>
                      ) : (
                        <span className="bg-background/80 backdrop-blur-md px-2 py-1 text-[7px] font-black tracking-widest uppercase text-foreground border border-foreground/10 flex items-center gap-1">
                          <Gift className="w-2.5 h-2.5" strokeWidth={2} /> Free
                        </span>
                      )}
                    </div>

                    {/* Queue */}
                    {item.queueCount > 0 && (
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md px-2 py-1 text-[7px] font-black tracking-widest uppercase text-fg-muted border border-foreground/10 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" strokeWidth={2} /> {item.queueCount}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-grow">
                    {item.brand && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-fg-faint mb-0.5 truncate">
                        {item.brand}
                      </span>
                    )}
                    <p className="text-[11px] font-bold text-foreground uppercase leading-snug line-clamp-2">
                      {item.title}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-foreground/5 mt-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${statusColors[item.status] ?? "text-fg-subtle"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/my-drops/edit/${item.id}`); }}
                        className="text-fg-faint hover:text-foreground transition-colors outline-none bg-transparent border-none p-0"
                        title="Manage"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}