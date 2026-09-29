import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, items, notifications, requests } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";

export async function POST(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const { itemId, message, receiverPhone, receiverEmail, receiverAddress } = await request.json();

    if (!itemId) return fail("itemId is required", 400);
    if (!receiverPhone || !receiverAddress || !receiverEmail) {
      return fail("Phone, Email, and Delivery Address are strictly required to receive items.", 400);
    }

    const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (!item) return fail("Item not found", 404);
    if (item.giverId === user.id) return fail("Cannot request your own item", 400);

    const [existing] = await db
      .select({ id: requests.id })
      .from(requests)
      .where(and(eq(requests.itemId, itemId), eq(requests.requesterId, user.id)))
      .limit(1);
    if (existing) return fail("Already requested", 409);

    const newRequest = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(requests)
        .values({ itemId, requesterId: user.id, message, receiverPhone, receiverEmail, receiverAddress })
        .returning();
      await tx.insert(notifications).values({
        userId: item.giverId,
        actorId: user.id,
        itemId,
        requestId: created.id,
        type: "REQUEST",
        message: message?.includes("offering item")
          ? `proposed a swap for your ${item.title}`
          : `requested your drop: ${item.title}`,
      });
      return created;
    });

    return ok(newRequest, { status: 201 });
  });
}
