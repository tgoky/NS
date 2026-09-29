"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError("Email is required");
    setError("");
    setStatus("sending");
    const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#050505] p-6 text-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-800/50 bg-zinc-900/40 p-10 backdrop-blur-xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-sm text-zinc-400">
            {status === "sent"
              ? "Check your inbox — the link signs you in and takes you to Settings to choose a new password."
              : "Enter the email you signed up with and we'll send you a reset link."}
          </p>
        </div>

        {status !== "sent" && (
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-zinc-800 bg-black/50 py-3.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-teal-500"
              />
            </div>
            {error && <p className="ml-1 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-black transition-colors hover:bg-teal-50 disabled:opacity-60"
            >
              {status === "sending" ? <Loader2 className="size-5 animate-spin" /> : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
