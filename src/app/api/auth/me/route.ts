import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { arr, db, users } from "@/db";
import { fail, ok, withAuth } from "@/lib/api";

export async function GET() {
  return withAuth(async ({ user, permissions }) =>
    ok({ ...user, preferredCategories: arr(user.preferredCategories), permissions }),
  );
}

const EDITABLE = ["fullName", "bio", "location", "avatar"] as const;

// Update the signed-in user's own profile fields.
export async function PATCH(request: NextRequest) {
  return withAuth(async ({ user }) => {
    const body = await request.json();
    const patch: Partial<Record<(typeof EDITABLE)[number], string | null>> = {};
    for (const key of EDITABLE) {
      if (!(key in body)) continue;
      const value = body[key];
      if (value !== null && typeof value !== "string") return fail(`${key} must be a string`, 400);
      patch[key] = typeof value === "string" ? value.trim() || null : null;
    }
    if (Object.keys(patch).length === 0) return ok(user);

    const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    return ok(updated);
  });
}
