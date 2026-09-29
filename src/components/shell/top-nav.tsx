"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, Bell, Gift, Heart, Inbox, Menu, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";

type TopNavProps = {
  onToggleSidebar: () => void;
  notificationsOpen: boolean;
  onToggleNotifications: () => void;
  unreadCount: number;
};

const CREATE_ACTIONS = [
  { href: "/list-stuffs/create", label: "Drop stuff", icon: Gift },
  { href: "/exchange/create", label: "Propose a swap", icon: ArrowLeftRight },
  { href: "/whatstuff", label: "Post a wish", icon: Inbox },
];

export function TopNav({ onToggleSidebar, notificationsOpen, onToggleNotifications, unreadCount }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSavedCount(json.data.length);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="relative z-30 flex h-12 w-full shrink-0 select-none items-center justify-between gap-3 border-b border-foreground/10 bg-background px-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden cursor-pointer rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-foreground/5 hover:text-foreground md:flex"
          title="Toggle navigation"
        >
          <Menu className="size-4" />
        </button>

        <Link href="/drops" className="text-sm font-black uppercase tracking-tighter text-foreground md:hidden">
          Stuffs<span className="italic text-fg-subtle">Drop</span>
        </Link>

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setCreateOpen((p) => !p)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-background transition-all hover:bg-brand active:scale-95 hover:text-black"
          >
            <Plus className="size-3.5" strokeWidth={3} />
            <span>Create</span>
          </button>

          {createOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCreateOpen(false)} />
              <div className="surface-glass absolute left-0 top-full z-50 mt-1.5 w-52 rounded-lg py-1 animate-in fade-in zoom-in-95 duration-100 md:left-full md:top-0 md:ml-2 md:mt-0">
                {CREATE_ACTIONS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setCreateOpen(false)}
                    className="group flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-fg-soft transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    <Icon className="size-3.5 text-fg-subtle group-hover:text-brand-ink" />
                    {label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="hidden min-w-0 max-w-[32%] flex-1 items-center md:flex">
        <Breadcrumbs />
      </div>

      <form
        className="hidden min-w-0 flex-1 justify-center sm:flex"
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          router.push(q ? `/list-stuffs?q=${encodeURIComponent(q)}` : "/list-stuffs");
        }}
      >
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or brands…"
            className="w-full rounded-full border border-border bg-card py-1.5 shadow-soft dark:border-foreground/10 dark:bg-foreground/[0.03] pl-9 pr-4 text-xs font-semibold text-foreground outline-none transition-colors placeholder:text-fg-faint focus:border-foreground/30"
          />
        </div>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Link
          href="/wishlist"
          title="Saved"
          className="relative rounded-md p-2 text-fg-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <Heart className="size-4" />
          {savedCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex size-3.5 items-center justify-center rounded-full bg-surface-4 text-[8px] font-black text-foreground">
              {savedCount > 9 ? "9+" : savedCount}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleNotifications}
          title="Notifications"
          aria-pressed={notificationsOpen}
          className={cn(
            "relative cursor-pointer rounded-md p-2 transition-colors",
            notificationsOpen ? "bg-foreground/10 text-foreground" : "text-fg-muted hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 animate-pulse rounded-full bg-brand" />}
        </button>
      </div>
    </header>
  );
}
