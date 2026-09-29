import {
  ArrowLeftRight,
  Footprints,
  Gift,
  Heart,
  Inbox,
  LayoutGrid,
  Package,
  PackagePlus,
  Settings,
  Shirt,
  Sparkles,
  Store,
  User,
  UtensilsCrossed,
  Watch,
  Wrench,
  FolderDot,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { title: string; href: string; icon: LucideIcon };

export type RailSection = {
  key: string;
  title: string;
  href: string;
  icon: LucideIcon;
  /** Path prefixes that belong to this section (drives rail highlight + sidebar content). */
  match: string[];
  /** Secondary sidebar content. Omit to hide the sidebar for this section. */
  groups?: { label?: string; links: NavLink[] }[];
};

export const ARCHIVE_CATEGORIES = [
  { slug: "shoes", category: "Shoes", title: "Footwear", icon: Footprints },
  { slug: "accessories", category: "Accessories", title: "Accessories", icon: Watch },
  { slug: "equipment", category: "Equipment", title: "Gear & Equip", icon: Wrench },
  { slug: "kitchen", category: "Kitchen", title: "Kitchenware", icon: UtensilsCrossed },
  { slug: "other", category: "Other", title: "Other Stuffs", icon: FolderDot },
] as const;

/**
 * The whole rail. Each section owns a set of routes; the secondary sidebar
 * swaps its content to whichever section the current route belongs to.
 */
export const RAIL_SECTIONS: RailSection[] = [
  {
    key: "discover",
    title: "Discover",
    href: "/drops",
    icon: Sparkles,
    match: ["/drops", "/list-stuffs", "/exchange"],
    groups: [
      {
        links: [
          { title: "Drop feed", href: "/drops", icon: LayoutGrid },
          { title: "All stuffs", href: "/list-stuffs", icon: Store },
          { title: "Exchange board", href: "/exchange", icon: ArrowLeftRight },
        ],
      },
      {
        label: "Give",
        links: [
          { title: "Drop stuff", href: "/list-stuffs/create", icon: Gift },
          { title: "Propose a swap", href: "/exchange/create", icon: ArrowLeftRight },
        ],
      },
    ],
  },
  {
    key: "archives",
    title: "Archives",
    href: "/garments",
    icon: Shirt,
    match: ["/garments", "/archives"],
    groups: [
      {
        links: [
          { title: "Garments", href: "/garments", icon: Shirt },
          ...ARCHIVE_CATEGORIES.map((c) => ({ title: c.title, href: `/archives/${c.slug}`, icon: c.icon })),
        ],
      },
    ],
  },
  {
    key: "wishes",
    title: "Wishes",
    href: "/whatstuff",
    icon: Inbox,
    match: ["/whatstuff"],
  },
  {
    key: "mine",
    title: "Mine",
    href: "/my-drops",
    icon: Package,
    match: ["/my-drops", "/my-requests", "/wishlist", "/profile"],
    groups: [
      {
        links: [
          { title: "My drops", href: "/my-drops", icon: Package },
          { title: "New drop", href: "/my-drops/create", icon: PackagePlus },
          { title: "Saved", href: "/wishlist", icon: Heart },
        ],
      },
      {
        label: "Account",
        links: [
          { title: "Profile", href: "/profile", icon: User },
          { title: "Settings", href: "/settings", icon: Settings },
        ],
      },
    ],
  },
];

export const SETTINGS_SECTION: RailSection = {
  key: "settings",
  title: "Settings",
  href: "/settings",
  icon: Settings,
  match: ["/settings"],
  groups: [
    {
      links: [
        { title: "Account", href: "/settings", icon: User },
        { title: "Profile", href: "/profile", icon: Package },
      ],
    },
  ],
};

export function matchesPath(prefix: string, pathname: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function sectionFor(pathname: string): RailSection | undefined {
  return [...RAIL_SECTIONS, SETTINGS_SECTION].find((s) => s.match.some((m) => matchesPath(m, pathname)));
}

/** Full-bleed flows (create forms) get the whole width — no secondary sidebar. */
export function hidesSidebar(pathname: string) {
  return pathname.endsWith("/create") || pathname.startsWith("/my-requests/delivery");
}
