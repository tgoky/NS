import { desc, eq } from "drizzle-orm";
import { arr, db, items, users } from "@/db";
import { ok, withAuth } from "@/lib/api";
import { timeAgo } from "@/lib/time";

export async function GET() {
  return withAuth(async () => {
    const rows = await db
      .select({
        id: items.id,
        title: items.title,
        images: items.images,
        createdAt: items.createdAt,
        username: users.username,
        avatar: users.avatar,
      })
      .from(items)
      .innerJoin(users, eq(items.giverId, users.id))
      .where(eq(items.status, "AVAILABLE"))
      .orderBy(desc(items.createdAt))
      .limit(6);

    const activity = rows.map((item) => ({
      id: item.id,
      user: item.username,
      userAvatar: item.avatar,
      time: timeAgo(item.createdAt),
      itemTitle: item.title,
      imageUrl: arr(item.images)[0] || "",
      type: "dropped",
    }));

    return ok(activity);
  });
}
