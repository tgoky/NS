import { NextRequest } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db, items, notifications, requests } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";

// Accept a request: the chosen requester wins, every other request on the
// item is rejected, and the item (plus any item offered in a swap) is claimed.
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async ({ user }) => {
    const { id } = await params;

    const target = await db.query.requests.findFirst({ where: eq(requests.id, id), with: { item: true } });
    if (!target) return fail("Request not found", 404);
    if (target.item.giverId !== user.id) return fail("Forbidden", 403);
    if (target.status !== "PENDING") return fail("This request has already been processed", 409);

    const offeredItemId = target.message?.match(/offering item ([a-zA-Z0-9]+)/)?.[1] ?? null;

    if (offeredItemId) {
      const [offered] = await db.select().from(items).where(eq(items.id, offeredItemId)).limit(1);
      if (!offered || offered.status !== "AVAILABLE") {
        return fail("The item offered for this swap is no longer available.", 400);
      }
    }

    await db.transaction(async (tx) => {
      await tx.update(requests).set({ status: "ACCEPTED" }).where(eq(requests.id, id));
      await tx
        .update(requests)
        .set({ status: "REJECTED" })
        .where(and(eq(requests.itemId, target.itemId), ne(requests.id, id)));
      await tx.update(items).set({ status: "CLAIMED" }).where(eq(items.id, target.itemId));
      await tx.insert(notifications).values({
        userId: target.requesterId,
        actorId: user.id,
        itemId: target.itemId,
        requestId: id,
        type: "ACCEPTED",
        message: `accepted your request for ${target.item.title}! Check delivery status.`,
      });
      if (offeredItemId) {
        await tx.update(items).set({ status: "CLAIMED" }).where(eq(items.id, offeredItemId));
      }
    });

    return ok({ status: "ACCEPTED" });
  });
}
