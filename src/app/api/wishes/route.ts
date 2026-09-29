import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db, wishes } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";
import { timeAgo } from "@/lib/time";

function formatWish(w: {
  id: string;
  request: string;
  category: string | null;
  bounty: string | null;
  urgency: string;
  isAnon: boolean;
  createdAt: Date;
  user: { username: string };
}) {
  return {
    id: w.id,
    type: "request" as const,
    user: w.isAnon ? `ANON_${w.id.slice(-4).toUpperCase()}` : w.user.username.toUpperCase(),
    request: w.request,
    category: (w.category || "GENERAL").toUpperCase(),
    bounty: w.bounty || "OPEN TRADE",
    urgency: w.urgency,
    span: "md:col-span-1 md:row-span-1",
    timestamp: timeAgo(w.createdAt).toUpperCase(),
    isAnon: w.isAnon,
  };
}

export async function GET() {
  return withAuth(async () => {
    const rows = await db.query.wishes.findMany({
      with: { user: { columns: { username: true } } },
      orderBy: desc(wishes.createdAt),
      limit: 50,
    });
    return ok(rows.map(formatWish));
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const { request: requestText, category, bounty, urgency, isAnon } = await request.json();

    if (!requestText?.trim()) return fail("Request text is required", 400);

    const [wish] = await db
      .insert(wishes)
      .values({
        request: requestText.trim(),
        category,
        bounty,
        urgency: urgency || "normal",
        isAnon: isAnon ?? false,
        userId: user.id,
      })
      .returning();

    return ok(formatWish({ ...wish, user: { username: user.username } }), { status: 201 });
  });
}
