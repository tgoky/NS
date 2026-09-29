"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ARCHIVE_CATEGORIES, sectionFor } from "@/lib/nav";

const LABELS: Record<string, string> = {
  drops: "Drop feed",
  "list-stuffs": "All stuffs",
  exchange: "Exchange",
  garments: "Garments",
  whatstuff: "What Stuff?",
  "my-drops": "My drops",
  delivery: "Delivery tracker",
  wishlist: "Saved",
  profile: "Profile",
  settings: "Settings",
  create: "New",
  show: "Details",
  edit: "Edit",
  ...Object.fromEntries(ARCHIVE_CATEGORIES.map((c) => [c.slug, c.title])),
};

/** Section › page › subpage, derived from the URL. Ids are shown as "Details". */
export function Breadcrumbs() {
  const pathname = usePathname();
  const section = sectionFor(pathname);
  const parts = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [];
  let href = "";
  for (const part of parts) {
    href += `/${part}`;
    const label = LABELS[part];
    // Route params (ids) fold into the crumb before them.
    if (!label) continue;
    if (part === "show" || part === "delivery") {
      crumbs.push({ label, href: pathname });
      break;
    }
    crumbs.push({ label, href });
  }

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
      {section && (
        <>
          <Link href={section.href} className="shrink-0 text-fg-faint transition-colors hover:text-fg-soft">
            {section.title}
          </Link>
          {crumbs.length > 0 && <ChevronRight className="size-3 shrink-0 text-fg-ghost" />}
        </>
      )}
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.href + i} className="flex min-w-0 items-center gap-1.5">
            {last ? (
              <span className="truncate text-foreground">{c.label}</span>
            ) : (
              <Link href={c.href} className="truncate text-fg-subtle transition-colors hover:text-fg-soft">
                {c.label}
              </Link>
            )}
            {!last && <ChevronRight className="size-3 shrink-0 text-fg-ghost" />}
          </span>
        );
      })}
    </nav>
  );
}
