"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LogOut, Plus, Settings, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { RAIL_SECTIONS, matchesPath } from "@/lib/nav";
import { useCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { LogoutDialog } from "./logout-dialog";
import { UserAvatar } from "./user-avatar";

/**
 * Column 1 of the shell: a narrow icon rail (same interaction as mcs-sdk's
 * PrimaryRail — the icon zooms up and the label folds away on hover/active).
 * Each item is a whole section; the secondary sidebar shows its pages.
 */
export function PrimaryRail() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <aside className="z-20 flex w-[76px] shrink-0 select-none flex-col items-center justify-between border-r border-foreground/10 bg-background px-1.5 py-3">
      <div className="flex w-full flex-col items-center gap-1.5">
        <Link
          href="/drops"
          title="stuffsdrop"
          className="group mb-1 flex h-[50px] w-full items-center justify-center rounded-xl"
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-brand text-[11px] font-black tracking-tighter text-black transition-transform duration-300 group-hover:scale-105">
            SD
          </span>
        </Link>

        <div className="my-0.5 h-px w-8 bg-foreground/10" />

        <nav className="flex w-full flex-col items-center gap-1.5">
          {RAIL_SECTIONS.map((section) => {
            const isActive = section.match.some((m) => matchesPath(m, pathname));
            const Icon = section.icon;
            return (
              <Link
                key={section.key}
                href={section.href}
                title={section.title}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex h-[58px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border p-1 transition-all duration-300",
                  isActive
                    ? "border-border bg-card font-semibold text-foreground shadow-soft dark:border-foreground/15 dark:bg-foreground/[0.06]"
                    : "border-transparent text-fg-subtle hover:bg-foreground/[0.05] hover:text-foreground dark:hover:bg-foreground/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center transition-all duration-300 ease-out",
                    isActive
                      ? "translate-y-[3px] scale-[1.4]"
                      : "group-hover:translate-y-[3px] group-hover:scale-[1.4]",
                  )}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={1.75} />
                </span>
                <span
                  className={cn(
                    "max-w-full origin-bottom truncate px-0.5 text-center text-[10px] font-semibold leading-none tracking-tight transition-all duration-300 ease-out",
                    isActive
                      ? "pointer-events-none mt-0 max-h-0 scale-75 opacity-0"
                      : "mt-1.5 max-h-4 scale-100 opacity-100 group-hover:pointer-events-none group-hover:mt-0 group-hover:max-h-0 group-hover:scale-75 group-hover:opacity-0",
                  )}
                >
                  {section.title}
                </span>
                {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative flex w-full flex-col items-center gap-2">
        <Link
          href="/list-stuffs/create"
          title="Drop stuff"
          className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background transition-all hover:bg-brand active:scale-95 hover:text-black"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
          className="mt-1 cursor-pointer rounded-full transition-all hover:ring-2 hover:ring-foreground/20"
          aria-label="Account menu"
          aria-expanded={menuOpen}
        >
          <UserAvatar user={user} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="surface-glass absolute bottom-0 left-full z-50 ml-2 w-64 space-y-3 rounded-2xl p-4 text-foreground animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} className="size-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{user.fullName || user.username}</p>
                  <p className="truncate text-xs text-fg-subtle">@{user.username}</p>
                </div>
              </div>
              <div className="h-px bg-foreground/10" />
              <div className="space-y-0.5">
                {[
                  { href: "/profile", label: "Profile", icon: User },
                  { href: "/my-drops", label: "My Drops", icon: LayoutGrid },
                  { href: "/settings", label: "Settings", icon: Settings },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-fg-soft transition-colors hover:bg-foreground/5 hover:text-foreground"
                  >
                    <Icon className="size-4 text-fg-subtle" />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-foreground/10 px-1 pt-3">
                <span className="text-xs font-semibold text-fg-subtle">Theme</span>
                <ThemeToggle />
              </div>
              <div className="border-t border-foreground/10 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmLogout(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <LogoutDialog open={confirmLogout} onClose={() => setConfirmLogout(false)} />
    </aside>
  );
}
