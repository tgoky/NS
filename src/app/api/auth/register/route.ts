import { NextRequest } from "next/server";
import { eq, or } from "drizzle-orm";
import { db, users, userRole, type UserRole } from "@/db";
import { fail, ok } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { RegistrationFormData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = createSupabaseAdminClient();
    } catch {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL");
      return fail("Server Configuration Error", 500, "CONFIG_ERROR");
    }

    const body: RegistrationFormData = await request.json();
    const { email, password, username, role, fullName, location } = body;

    if (!email || !password || !username || !role || !fullName || !location) {
      return fail("Missing required fields", 400, "VALIDATION_ERROR");
    }
    if (!(userRole.enumValues as readonly string[]).includes(role)) {
      return fail("Invalid role", 400, "VALIDATION_ERROR");
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);
    if (existing) return fail("Email or Username already taken", 409, "USER_EXISTS");

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName, role, location },
    });
    if (authError || !authData.user) {
      return fail(authError?.message || "Supabase signup failed", 400, "AUTH_ERROR");
    }

    try {
      const [user] = await db
        .insert(users)
        .values({
          email,
          username,
          supabaseId: authData.user.id,
          fullName,
          location,
          role: role as UserRole,
          bio: body.bio,
          avatar: body.avatar,
          preferredCategories: body.preferredCategories || [],
          socialLinks: body.socialLinks || {},
        })
        .returning();
      return ok(user, { status: 201 });
    } catch (dbError) {
      // Don't leave an auth account behind with no User row.
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
      throw dbError;
    }
  } catch (error) {
    console.error("Registration API Error:", error);
    return fail("Internal Server Error", 500, "INTERNAL_ERROR");
  }
}
