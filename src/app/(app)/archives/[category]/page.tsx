import { notFound } from "next/navigation";
import { ArchiveFeed } from "@/components/archive-feed";
import { ARCHIVE_CATEGORIES } from "@/lib/nav";

const BLURBS: Record<string, string> = {
  shoes: "Sneakers, boots and everything between. Pre-loved pairs looking for their next stride.",
  accessories: "Watches, bags, jewellery and the small things that finish a look.",
  equipment: "Tools, gear and kit that still has plenty of work left in it.",
  kitchen: "Cookware, utensils and appliances ready for another kitchen.",
  other: "Everything that doesn't fit a shelf. Browse the odds and ends.",
};

export default async function ArchiveCategoryPage({ params }: PageProps<"/archives/[category]">) {
  const { category: slug } = await params;
  const entry = ARCHIVE_CATEGORIES.find((c) => c.slug === slug);
  if (!entry) notFound();

  return <ArchiveFeed category={entry.category} title={entry.title} blurb={BLURBS[entry.slug]} />;
}
