"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { RAIL_SECTIONS, SETTINGS_SECTION, matchesPath } from "@/lib/nav";
import { useCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "./sign-out";

/**
 * Below md the rail and sidebar are hidden; this floating pill opens a
 * full-screen list built from the same RAIL_SECTIONS, so both layouts
 * always offer the same destinations.
 */
export function MobileNav({ unreadCount, onOpenNotifications }: { unreadCount: number; onOpenNotifications: () => void }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close on navigation.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 md:hidden">
        <div className="flex items-center gap-3.5 rounded-2xl border border-foreground/10 bg-card/95 px-4 py-2.5 text-foreground shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg-soft"
            aria-label="Notifications"
          >
            <Bell className="size-4 text-fg-subtle" />
            Activity
            {unreadCount > 0 && <span className="absolute -right-1.5 -top-0.5 size-1.5 rounded-full bg-brand" />}
          </button>
          <div className="h-4 w-px bg-foreground/15" />
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="flex cursor-pointer items-center p-0.5 text-fg-soft"
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background md:hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-foreground/10 bg-background/95 px-5 py-4 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-subtle">Navigation</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-lg p-1.5 text-fg-subtle hover:bg-foreground/5 hover:text-foreground"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-foreground/5 pb-24">
            {[...RAIL_SECTIONS, SETTINGS_SECTION].map((section) => {
              const links = section.groups?.flatMap((g) => g.links) ?? [
                { title: section.title, href: section.href, icon: section.icon },
              ];
              return (
                <div key={section.key} className="px-5 py-4">
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-fg-faint">{section.title}</p>
                  {links.map(({ title, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "-mx-3 flex items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-bold uppercase tracking-wide transition-colors",
                        matchesPath(href, pathname) ? "bg-foreground/[0.06] text-foreground" : "text-fg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4 text-fg-subtle" />
                      {title}
                    </Link>
                  ))}
                </div>
              );
            })}

            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-fg-faint">Theme</span>
              <ThemeToggle showLabels />
            </div>

            <div className="px-5 py-4">
              <p className="mb-3 truncate text-sm font-bold text-fg-soft">
                {user.fullName || user.username}
                <span className="mt-0.5 block text-xs font-normal text-fg-subtle">@{user.username}</span>
              </p>
              <button
                type="button"
                onClick={() => signOut()}
                className="-mx-3 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
