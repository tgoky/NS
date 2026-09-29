import { redirect } from "next/navigation";
import { ShellLayout } from "@/components/shell/shell-layout";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  // Signed in with Supabase but no app profile (e.g. sign-up failed half way).
  if (!session.user) redirect("/register?incomplete=1");

  const { id, username, fullName, avatar, email, role } = session.user;
  return <ShellLayout user={{ id, username, fullName, avatar, email, role }}>{children}</ShellLayout>;
}
