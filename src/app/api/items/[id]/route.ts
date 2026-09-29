import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { arr, comments, db, itemCondition, items, requests, savedItems } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  return withAuth(async ({ user }) => {
    const { id } = await params;

    const item = await db.query.items.findFirst({
      where: eq(items.id, id),
      with: {
        giver: { columns: { username: true, avatar: true } },
        comments: {
          with: { user: { columns: { username: true, avatar: true } } },
          orderBy: desc(comments.createdAt),
        },
        requests: {
          with: { requester: { columns: { username: true, avatar: true } } },
          orderBy: desc(requests.createdAt),
        },
      },
    });

    if (!item) return fail("Item not found", 404);

    const isOwner = item.giverId === user.id;
    const isWinner =
      item.status === "CLAIMED" && item.requests.some((r) => r.status === "ACCEPTED" && r.requesterId === user.id);

    // The release code is only ever shown to the receiver, via /api/delivery.
    // Receiver contact details go to the giver and to the requester themselves.
    const safeRequests = item.requests.map(({ deliveryOtp: _otp, ...r }) =>
      isOwner || r.requesterId === user.id
        ? r
        : { ...r, receiverPhone: null, receiverEmail: null, receiverAddress: null },
    );

    return ok({
      ...item,
      images: arr(item.images),
      tags: arr(item.tags),
      requests: safeRequests.map((r) => ({ ...r, disputePhotos: arr(r.disputePhotos) })),
      _count: { requests: item.requests.length },
      isOwner,
      isWinner,
    });
  });
}

const EDITABLE_FIELDS = [
  "title",
  "description",
  "brand",
  "size",
  "category",
  "condition",
  "images",
  "tags",
  "isExchange",
  "seekingDescription",
  "location",
  "latitude",
  "longitude",
] as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(async ({ user }) => {
    const { id } = await params;
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (!item || item.giverId !== user.id) return fail("Not found or forbidden", 403);

    const body = await request.json();
    // Only listing content is editable here; status moves through requests/delivery.
    const patch: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) if (key in body) patch[key] = body[key];

    if ("condition" in patch && !(itemCondition.enumValues as readonly unknown[]).includes(patch.condition)) {
      return fail("Invalid condition", 400, "VALIDATION_ERROR");
    }
    if (Object.keys(patch).length === 0) return ok(item);

    const [updated] = await db.update(items).set(patch).where(eq(items.id, id)).returning();
    return ok(updated);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async ({ user }) => {
    const { id } = await params;
    const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (!item) return fail("Item not found", 404);
    if (item.giverId !== user.id) return fail("Forbidden", 403);

    await db.transaction(async (tx) => {
      await tx.delete(savedItems).where(eq(savedItems.itemId, id));
      await tx.delete(requests).where(eq(requests.itemId, id));
      await tx.delete(items).where(eq(items.id, id));
    });

    return ok();
  });
}
