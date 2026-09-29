import { NextResponse } from "next/server";
import type { User } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getUserPermissions } from "@/lib/permissions";
import type { ApiResponse, UserPermissions } from "@/lib/types";

export type AuthContext = { user: User; permissions: UserPermissions };

/** Runs `handler` for a signed-in user with an app User row; 401/404 otherwise. */
export async function withAuth(handler: (ctx: AuthContext) => Promise<NextResponse>): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "Unauthorized", code: "401" } },
        { status: 401 },
      );
    }
    if (!session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: { message: "User record not found.", code: "USER_NOT_FOUND" } },
        { status: 404 },
      );
    }
    return await handler({ user: session.user, permissions: getUserPermissions(session.user) });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: { message: "Internal Server Error" } },
      { status: 500 },
    );
  }
}

export function fail(message: string, status: number, code?: string) {
  return NextResponse.json<ApiResponse>({ success: false, error: { message, ...(code ? { code } : {}) } }, { status });
}

export function ok<T>(data?: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, ...(data !== undefined ? { data } : {}), ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200 },
  );
}
