"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, Loader2, LogOut, Palette, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { signOut } from "@/components/shell/sign-out";

type Profile = {
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  location: string | null;
  avatar: string | null;
  role: string;
  subscriptionTier: string;
};

const inputClass =
  "w-full bg-card border border-foreground/10 px-4 py-3 text-xs font-semibold text-foreground outline-none transition-colors placeholder:text-fg-ghost focus:border-foreground/40";
const labelClass = "mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-fg-subtle";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", bio: "", location: "", avatar: "" });
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [profileError, setProfileError] = useState("");

  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [pwState, setPwState] = useState<"idle" | "saving" | "saved">("idle");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        setProfile(json.data);
        setForm({
          fullName: json.data.fullName ?? "",
          bio: json.data.bio ?? "",
          location: json.data.location ?? "",
          avatar: json.data.avatar ?? "",
        });
      })
      .catch(() => {});
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("saving");
    setProfileError("");
    const json = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .catch(() => ({ success: false }));
    if (!json.success) {
      setProfileError(json.error?.message || "Could not save your profile");
      setSaving("idle");
      return;
    }
    setProfile(json.data);
    setSaving("saved");
    setTimeout(() => setSaving("idle"), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (password.next.length < 8) return setPwError("Use at least 8 characters");
    if (password.next !== password.confirm) return setPwError("Passwords don't match");
    setPwState("saving");
    const { error } = await getSupabaseBrowserClient().auth.updateUser({ password: password.next });
    if (error) {
      setPwError(error.message);
      setPwState("idle");
      return;
    }
    setPassword({ next: "", confirm: "" });
    setPwState("saved");
    setTimeout(() => setPwState("idle"), 2000);
  };

  return (
    <div className="min-h-full bg-background pb-32 text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-10 border-b border-foreground/10 pb-8">
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.3em] text-fg-subtle">Account</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter md:text-5xl">Settings</h1>
          {profile && (
            <p className="mt-3 text-xs font-medium tracking-wide text-fg-subtle">
              @{profile.username} · {profile.email} · {profile.role} · {profile.subscriptionTier}
            </p>
          )}
        </div>

        <form onSubmit={saveProfile} className="mb-12 space-y-6">
          <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
            <User className="size-4 text-fg-subtle" /> Profile
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Full name</label>
              <input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Avatar URL</label>
            <input
              className={inputClass}
              value={form.avatar}
              placeholder="https://…"
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Bio</label>
            <textarea
              rows={4}
              className={`${inputClass} resize-none`}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          {profileError && <p className="text-xs text-red-400">{profileError}</p>}
          <button
            type="submit"
            disabled={!profile || saving === "saving"}
            className="inline-flex cursor-pointer items-center gap-2 bg-foreground px-6 py-3 text-[10px] font-black uppercase tracking-widest text-background transition-colors hover:bg-brand disabled:opacity-50 hover:text-black"
          >
            {saving === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : saving === "saved" ? <Check className="size-3.5" /> : null}
            {saving === "saved" ? "Saved" : "Save profile"}
          </button>
        </form>

        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-10">
          <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
            <Palette className="size-4 text-fg-subtle" /> Appearance
          </h2>
          <ThemeToggle showLabels />
        </div>

        <form onSubmit={changePassword} className="mb-12 space-y-6 border-t border-foreground/10 pt-10">
          <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
            <KeyRound className="size-4 text-fg-subtle" /> Password
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={password.next}
                onChange={(e) => setPassword({ ...password, next: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm</label>
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
              />
            </div>
          </div>
          {pwError && <p className="text-xs text-red-400">{pwError}</p>}
          <button
            type="submit"
            disabled={pwState === "saving"}
            className="inline-flex cursor-pointer items-center gap-2 border border-foreground/20 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:border-foreground disabled:opacity-50"
          >
            {pwState === "saving" && <Loader2 className="size-3.5 animate-spin" />}
            {pwState === "saved" ? "Password updated" : "Update password"}
          </button>
        </form>

        <div className="border-t border-foreground/10 pt-10">
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:text-red-400"
          >
            <LogOut className="size-3.5" /> Log out
          </button>
        </div>
      </main>
    </div>
  );
}
