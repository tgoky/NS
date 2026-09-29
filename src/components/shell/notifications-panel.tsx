"use client";

import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { notificationHref, type NotificationsState } from "./use-notifications";

/**
 * Right utility panel. It's a flex sibling of <main> (not an overlay), so
 * the page shrinks to make room — same layout contract as mcs-sdk.
 */
export function NotificationsPanel({ state, onClose }: { state: NotificationsState; onClose: () => void }) {
  const router = useRouter();
  const { notifications, loaded, unreadCount, markAllRead } = state;

  return (
    <aside className="flex w-full shrink-0 flex-col border-l border-foreground/10 bg-sidebar sm:w-[360px]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-foreground/10 px-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">History</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className={cn(
              "cursor-pointer text-[9px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed",
              unreadCount > 0 ? "text-brand-ink hover:text-foreground" : "text-fg-faint",
            )}
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-fg-subtle hover:bg-foreground/5 hover:text-foreground"
            aria-label="Close notifications"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((n) => {
            const href = notificationHref(n);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => href && router.push(href)}
                className="flex w-full cursor-pointer gap-3 border-b border-foreground/5 p-4 text-left transition-colors hover:bg-foreground/[0.03]"
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    n.type === "DISPUTE" ? "bg-red-500" : !n.isRead ? "animate-pulse bg-brand" : "bg-surface-4",
                  )}
                />
                <span className="flex flex-col">
                  <span className={cn("text-[11px] leading-snug", !n.isRead ? "text-fg-soft" : "text-fg-subtle")}>
                    <span
                      className={cn(
                        "font-bold uppercase",
                        n.type === "DISPUTE" ? "text-red-400" : !n.isRead ? "text-brand-ink" : "text-fg-muted",
                      )}
                    >
                      @{n.user}
                    </span>{" "}
                    {n.message}
                  </span>
                  <span className="mt-1.5 text-[8px] font-black uppercase tracking-widest text-fg-faint">{n.time}</span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Bell className="size-5 text-fg-ghost" />
            <p className="text-[10px] font-black uppercase tracking-widest text-fg-faint">
              {loaded ? "No activity timeline yet" : "Loading…"}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
