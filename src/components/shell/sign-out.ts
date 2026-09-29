"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function signOut() {
  await getSupabaseBrowserClient().auth.signOut();
  // Full reload so every client cache and server component drops the old session.
  window.location.replace("/login");
}
