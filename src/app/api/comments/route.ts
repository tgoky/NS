import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { comments, db, items, notifications } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";

export async function POST(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const { itemId, text } = await request.json();

    if (!itemId || !text?.trim()) return fail("Item ID and text are required", 400);

    const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (!item) return fail("Item not found", 404);

    const [comment] = await db.insert(comments).values({ text: text.trim(), itemId, userId: user.id }).returning();

    if (item.giverId !== user.id) {
      await db.insert(notifications).values({
        userId: item.giverId,
        actorId: user.id,
        itemId,
        type: "COMMENT",
        message: `commented on your drop: "${item.title}"`,
      });
    }

    return ok({ ...comment, user: { username: user.username, avatar: user.avatar } }, { status: 201 });
  });
}
