import { and, desc, eq } from "drizzle-orm";
import { db, notifications } from "@/db";
import { ok, withAuth } from "@/lib/api";
import { timeAgo } from "@/lib/time";

export async function GET() {
  return withAuth(async ({ user }) => {
    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      with: {
        actor: { columns: { username: true } },
        item: { columns: { title: true } },
      },
      orderBy: desc(notifications.createdAt),
      limit: 40,
    });

    return ok(
      rows.map((n) => ({
        id: n.id,
        itemId: n.itemId,
        requestId: n.requestId,
        user: n.actor?.username || "System",
        message: n.message,
        time: timeAgo(n.createdAt),
        isRead: n.isRead,
        type: n.type,
      })),
    );
  });
}

// Mark all as read
export async function PATCH() {
  return withAuth(async ({ user }) => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
    return ok();
  });
}
