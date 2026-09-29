import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { arr, db, items, savedItems } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";
import { timeAgo } from "@/lib/time";

const statusDisplayMap: Record<string, string> = {
  AVAILABLE: "available",
  PENDING: "pending",
  CLAIMED: "unavailable",
};

export async function GET() {
  return withAuth(async ({ user }) => {
    const saved = await db.query.savedItems.findMany({
      where: eq(savedItems.userId, user.id),
      with: { item: { with: { giver: { columns: { username: true } } } } },
      orderBy: desc(savedItems.savedAt),
    });

    return ok(
      saved.map((s) => ({
        id: s.id,
        itemId: s.itemId,
        user: s.item.giver.username,
        brand: s.item.brand || "",
        title: s.item.title,
        imageUrl: arr(s.item.images)[0] || "",
        savedAt: timeAgo(s.savedAt),
        status: statusDisplayMap[s.item.status] || "available",
        type: s.item.isExchange ? "swap" : "request",
        seeking: s.item.seekingDescription || "",
      })),
    );
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const { itemId } = await request.json();
    if (!itemId) return fail("itemId is required", 400);

    const [exists] = await db.select({ id: items.id }).from(items).where(eq(items.id, itemId)).limit(1);
    if (!exists) return fail("Item not found", 404, "NOT_FOUND");

    await db.insert(savedItems).values({ userId: user.id, itemId }).onConflictDoNothing();
    const [saved] = await db
      .select()
      .from(savedItems)
      .where(and(eq(savedItems.userId, user.id), eq(savedItems.itemId, itemId)))
      .limit(1);

    return ok(saved, { status: 201 });
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const itemId = new URL(request.url).searchParams.get("itemId");
    if (!itemId) return fail("itemId query param is required", 400);

    await db.delete(savedItems).where(and(eq(savedItems.userId, user.id), eq(savedItems.itemId, itemId)));
    return ok();
  });
}
