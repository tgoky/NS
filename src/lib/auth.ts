import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, users, type User } from "@/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = {
  supabaseId: string;
  email: string | undefined;
  /** The app's own User row, or null if the auth user has none yet. */
  user: User | null;
};

/**
 * The signed-in user for this request, or null. Cached per request so the
 * shell layout, pages and route handlers share one lookup.
 *
 * The User row is always read from the database by supabaseId. The old app
 * trusted an id stored in Supabase `user_metadata`, which every user can
 * rewrite for themselves with `auth.updateUser()` — that let anyone act as
 * any other account.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();
  if (error || !authUser) return null;

  const [user] = await db.select().from(users).where(eq(users.supabaseId, authUser.id)).limit(1);
  return { supabaseId: authUser.id, email: authUser.email, user: user ?? null };
});
