import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginClient from "./login-client";

export default async function Login() {
  const session = await getSession();
  if (session?.user) redirect("/drops");
  return <LoginClient />;
}
