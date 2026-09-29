import { NextRequest } from "next/server";
import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { arr, db, deliveryMethod, items, notifications, requests, type DeliveryMethod } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";

function generateOtp(): string {
  return randomInt(1000, 10000).toString();
}

export async function POST(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const { action, requestId, ...payload } = await request.json();

    if (!requestId || !action) return fail("requestId and action are required", 400);

    const target = await db.query.requests.findFirst({ where: eq(requests.id, requestId), with: { item: true } });
    if (!target) return fail("Request not found", 404);
    if (!target.item) return fail("Associated item not found", 404);

    const isGiver = target.item.giverId === user.id;
    const isReceiver = target.requesterId === user.id;
    const notify = (userId: string, type: string, message: string) => ({
      userId,
      actorId: user.id,
      itemId: target.itemId,
      requestId: target.id,
      type,
      message,
    });

    if (action === "set_delivery_method") {
      if (!isGiver) return fail("Forbidden", 403);
      if (target.status !== "ACCEPTED") return fail("Accept this request before arranging delivery", 409);

      const { dispatchName, dispatchPhone, parkLocation, courierName, trackingNumber } = payload;
      const method = payload.deliveryMethod as DeliveryMethod;
      if (!(deliveryMethod.enumValues as readonly string[]).includes(method)) {
        return fail("Invalid delivery method", 400);
      }

      // OTP IS ONLY FOR FACE-TO-FACE MEETUPS
      const needsOtp = method === "MEETUP";
      const otp = needsOtp ? generateOtp() : null;

      const updated = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(requests)
          .set({
            deliveryMethod: method,
            deliveryStatus: "PENDING_DISPATCH",
            deliveryOtp: otp,
            dispatchName: dispatchName || null,
            dispatchPhone: dispatchPhone || null,
            parkLocation: parkLocation || null,
            courierName: courierName || null,
            trackingNumber: trackingNumber || null,
          })
          .where(eq(requests.id, requestId))
          .returning();
        await tx.update(items).set({ status: "CLAIMED" }).where(eq(items.id, target.itemId));
        await tx
          .insert(notifications)
          .values(
            notify(
              target.requesterId,
              "DELIVERY_UPDATE",
              `set the delivery method to ${method.replace("_", " ")} for ${target.item.title}.`,
            ),
          );
        return row;
      });

      // The giver never gets the release code back.
      const { deliveryOtp: _otp, ...safe } = updated;
      return ok({ ...safe, otpGenerated: needsOtp });
    }

    if (action === "mark_dispatched") {
      if (!isGiver) return fail("Forbidden", 403);
      if (target.deliveryStatus !== "PENDING_DISPATCH") return fail("Set a delivery method first", 409);

      const { waybillReceiptUrl, dispatchName, dispatchPhone } = payload;

      const updated = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(requests)
          .set({
            deliveryStatus: "IN_TRANSIT",
            dispatchedAt: new Date(),
            waybillReceiptUrl: waybillReceiptUrl || null,
            dispatchName: dispatchName || target.dispatchName,
            dispatchPhone: dispatchPhone || target.dispatchPhone,
          })
          .where(eq(requests.id, requestId))
          .returning();
        await tx.update(items).set({ status: "IN_TRANSIT" }).where(eq(items.id, target.itemId));
        await tx
          .insert(notifications)
          .values(notify(target.requesterId, "DELIVERY_UPDATE", "dispatched your item! It is now in transit."));
        return row;
      });

      const { deliveryOtp: _otp, ...safe } = updated;
      return ok(safe);
    }

    if (action === "verify_otp") {
      if (!isGiver) return fail("Only the giver can verify the delivery OTP during a meetup", 403);
      if (target.deliveryStatus === "DELIVERED" || target.deliveryStatus === "DISPUTED") {
        return fail("This transaction is already complete", 409);
      }
      if (target.deliveryStatus !== "IN_TRANSIT") return fail("Item must be in transit before verifying OTP", 403);
      if (!target.deliveryOtp) return fail("No OTP set for this delivery", 400);
      if (payload.otp !== target.deliveryOtp) {
        return fail("Incorrect Release Code. Please check with the receiver.", 400);
      }

      await db.transaction(async (tx) => {
        await tx
          .update(requests)
          .set({ deliveryStatus: "DELIVERED", otpVerifiedAt: new Date(), deliveredAt: new Date() })
          .where(eq(requests.id, requestId));
        await tx.update(items).set({ status: "DELIVERED" }).where(eq(items.id, target.itemId));
        await tx
          .insert(notifications)
          .values(notify(target.requesterId, "DELIVERED", "verified your release code. Delivery is complete!"));
      });

      return ok({ message: "Delivery confirmed! Transaction complete." });
    }

    if (action === "receiver_confirm") {
      if (!isReceiver) return fail("Forbidden", 403);
      if (target.deliveryStatus === "DELIVERED" || target.deliveryStatus === "DISPUTED") {
        return fail("This transaction is already complete", 409);
      }
      if (target.deliveryStatus !== "IN_TRANSIT") return fail("Item must be in transit before confirming receipt", 403);

      await db.transaction(async (tx) => {
        await tx
          .update(requests)
          .set({ deliveryStatus: "DELIVERED", deliveredAt: new Date() })
          .where(eq(requests.id, requestId));
        await tx.update(items).set({ status: "DELIVERED" }).where(eq(items.id, target.itemId));
        await tx
          .insert(notifications)
          .values(notify(target.item.giverId, "DELIVERED", "confirmed receipt of your item. Transaction complete!"));
      });

      return ok({ message: "Delivery confirmed. Thank you!" });
    }

    if (action === "raise_dispute") {
      if (!isReceiver && !isGiver) return fail("Forbidden", 403);
      if (target.deliveryStatus === "DISPUTED") return fail("A dispute is already open for this transaction", 409);
      if (target.deliveryStatus !== "IN_TRANSIT") {
        return fail("Disputes can only be raised while the item is in transit", 403);
      }

      const { disputeReason, disputePhotos } = payload;

      await db.transaction(async (tx) => {
        await tx
          .update(requests)
          .set({
            deliveryStatus: "DISPUTED",
            disputeReason: disputeReason || "No reason provided",
            disputePhotos: Array.isArray(disputePhotos) ? disputePhotos : [],
          })
          .where(eq(requests.id, requestId));
        await tx.update(items).set({ status: "DISPUTED" }).where(eq(items.id, target.itemId));
        await tx
          .insert(notifications)
          .values(
            notify(
              isReceiver ? target.item.giverId : target.requesterId,
              "DISPUTE",
              `raised a dispute regarding the delivery of ${target.item.title}.`,
            ),
          );
      });

      return ok({ message: "Dispute raised. Our team will review within 24 hours." });
    }

    return fail("Unknown action", 400);
  });
}

export async function GET(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const requestId = new URL(request.url).searchParams.get("requestId");
    if (!requestId) return fail("requestId is required", 400);

    const target = await db.query.requests.findFirst({
      where: eq(requests.id, requestId),
      with: {
        item: { with: { giver: { columns: { username: true, avatar: true } } } },
        requester: { columns: { username: true, avatar: true } },
      },
    });
    if (!target) return fail("Request not found", 404);

    const isGiver = target.item.giverId === user.id;
    const isReceiver = target.requesterId === user.id;
    if (!isGiver && !isReceiver) return fail("Forbidden", 403);

    // RECEIVER SEES THE OTP, GIVER DOES NOT
    return ok({
      ...target,
      disputePhotos: arr(target.disputePhotos),
      item: { ...target.item, images: arr(target.item.images), tags: arr(target.item.tags) },
      deliveryOtp: isReceiver ? target.deliveryOtp : undefined,
      isGiver,
      isReceiver,
    });
  });
}
