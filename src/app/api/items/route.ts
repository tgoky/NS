import { NextRequest } from "next/server";
import { and, desc, eq, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { arr, db, items, itemCondition, users, type ItemCondition } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";
import { formatDropDate, timeAgo } from "@/lib/time";

const conditionMap: Record<string, string> = {
  NEW: "Brand New",
  LIKE_NEW: "Like New",
  GOOD: "Pre-Owned",
  FAIR: "Heavily Worn",
};

const VALID_CONDITIONS = new Set<string>(itemCondition.enumValues);

const statusMap: Record<string, string> = {
  AVAILABLE: "active",
  PENDING: "pending",
  CLAIMED: "completed",
};

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isExchange = searchParams.get("isExchange");
    const mine = searchParams.get("mine");
    const condition = searchParams.get("condition");
    const size = searchParams.get("size");
    const cursor = searchParams.get("cursor");
    const q = searchParams.get("q")?.trim();
    const requested = parseInt(searchParams.get("take") || String(PAGE_SIZE), 10);
    const take = Math.min(Number.isFinite(requested) && requested > 0 ? requested : PAGE_SIZE, 100);

    const where: SQL[] = [];
    where.push(mine === "true" ? eq(items.giverId, user.id) : eq(items.status, "AVAILABLE"));
    if (category && category !== "All") where.push(eq(items.category, category));
    if (isExchange === "true") where.push(eq(items.isExchange, true));
    if (condition && VALID_CONDITIONS.has(condition)) where.push(eq(items.condition, condition as ItemCondition));
    if (size) where.push(eq(items.size, size));
    if (q) {
      const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      where.push(or(ilike(items.title, pattern), ilike(items.brand, pattern), ilike(items.description, pattern))!);
    }

    // Keyset pagination on (createdAt, id), both descending.
    if (cursor) {
      const [anchor] = await db
        .select({ createdAt: items.createdAt })
        .from(items)
        .where(eq(items.id, cursor))
        .limit(1);
      if (anchor) {
        where.push(
          or(
            lt(items.createdAt, anchor.createdAt),
            and(eq(items.createdAt, anchor.createdAt), lt(items.id, cursor)),
          )!,
        );
      }
    }

    const rows = await db
      .select({
        item: items,
        giverUsername: users.username,
        requestCount: sql<number>`(select count(*) from "Request" r where r."itemId" = ${items.id})::int`,
      })
      .from(items)
      .innerJoin(users, eq(items.giverId, users.id))
      .where(and(...where))
      .orderBy(desc(items.createdAt), desc(items.id))
      .limit(take + 1);

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? page[page.length - 1].item.id : null;

    const formatted = page.map(({ item, giverUsername, requestCount }) => ({
      id: item.id,
      title: item.title,
      brand: item.brand || "",
      category: item.category,
      imageUrl: arr(item.images)[0] || "",
      condition: conditionMap[item.condition] || item.condition,
      size: item.size || "",
      postedAt: timeAgo(item.createdAt),
      date: formatDropDate(item.createdAt),
      status: statusMap[item.status] || "active",
      queueCount: requestCount,
      swapOffers: 0,
      user: giverUsername,
      offeringTitle: item.title,
      offeringImage: arr(item.images)[0] || "",
      seeking: item.seekingDescription || "",
      isExchange: item.isExchange,
    }));

    return ok(formatted, { meta: { nextCursor, hasMore } });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const body = await request.json();
    const { title, brand, category, condition, images, tags, size, description, isExchange, seekingDescription, location } =
      body;

    if (!title || !category || !condition) return fail("Missing required fields", 400, "VALIDATION_ERROR");

    if (!VALID_CONDITIONS.has(condition)) {
      return fail(
        `Invalid condition. Must be one of: ${Array.from(VALID_CONDITIONS).join(", ")}`,
        400,
        "VALIDATION_ERROR",
      );
    }

    const [item] = await db
      .insert(items)
      .values({
        title,
        brand,
        description,
        category,
        condition,
        images: images || [],
        tags: tags || [],
        size,
        isExchange: isExchange ?? false,
        seekingDescription,
        location,
        giverId: user.id,
      })
      .returning();

    return ok(item, { status: 201 });
  });
}
