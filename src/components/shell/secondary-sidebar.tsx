"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { sectionFor } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Column 2 of the shell. Its content swaps entirely based on which rail
 * section the current route belongs to; sections without pages of their
 * own render nothing so the page gets the full width.
 */
export function SecondarySidebar() {
  const pathname = usePathname();
  const section = sectionFor(pathname);
  if (!section?.groups) return null;

  // The most specific link wins, so /list-stuffs/create doesn't also light up /list-stuffs.
  const allLinks = section.groups.flatMap((g) => g.links);
  const activeHref = allLinks
    .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="no-scrollbar flex w-60 shrink-0 select-none flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-2 py-3 text-sidebar-foreground">
      <div className="px-3 pb-3 pt-1">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-fg-faint">stuffsdrop</p>
        <h2 className="mt-1 text-[15px] font-black uppercase tracking-tight text-foreground">{section.title}</h2>
      </div>

      <div className="flex-1 space-y-5">
        {section.groups.map((group, i) => (
          <div key={group.label ?? i}>
            {group.label && (
              <p className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-fg-faint">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const active = link.href === activeHref;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors",
                      active
                        ? "border-border bg-card text-foreground shadow-soft dark:border-foreground/10 dark:bg-foreground/[0.06]"
                        : "border-transparent text-fg-subtle hover:bg-foreground/[0.04] hover:text-fg-soft",
                    )}
                  >
                    <Icon
                      className={cn("size-4 shrink-0", active ? "text-brand-ink" : "text-fg-faint group-hover:text-fg-soft")}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{link.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/list-stuffs/create"
        className="group mt-6 block rounded-xl border border-border bg-card bg-gradient-to-br from-brand/[0.08] to-transparent p-4 shadow-soft transition-colors hover:border-brand-ink/40 dark:from-foreground/[0.06]"
      >
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-ink">Give</p>
        <p className="mt-1 text-sm font-black uppercase tracking-tight text-foreground">Got stuffs to drop?</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-fg-muted group-hover:text-foreground">
          Start a drop <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </aside>
  );
}
