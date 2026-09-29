"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UploadCloud, X } from "lucide-react";

const CATEGORIES = ["Clothing", "Shoes", "Accessories", "Equipment", "Kitchen", "Other"];
const CONDITIONS = [
  { value: "NEW", label: "Brand New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Pre-Owned" },
  { value: "FAIR", label: "Archival" },
];

type Form = {
  title: string;
  brand: string;
  description: string;
  category: string;
  condition: string;
  size: string;
  location: string;
  isExchange: boolean;
  seekingDescription: string;
  images: string[];
};

const inputClass =
  "w-full bg-card border border-foreground/10 px-4 py-3 text-xs font-semibold text-foreground outline-none transition-colors placeholder:text-fg-ghost focus:border-foreground/40";
const labelClass = "mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-fg-subtle";

export default function EditDropPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return setError(json.error?.message || "Drop not found");
        if (!json.data.isOwner) return setError("You can only edit your own drops");
        const d = json.data;
        setForm({
          title: d.title ?? "",
          brand: d.brand ?? "",
          description: d.description ?? "",
          category: d.category ?? "Other",
          condition: d.condition ?? "GOOD",
          size: d.size ?? "",
          location: d.location ?? "",
          isExchange: !!d.isExchange,
          seekingDescription: d.seekingDescription ?? "",
          images: d.images ?? [],
        });
      })
      .catch(() => setError("Could not load this drop"));
  }, [id]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const json = await fetch("/api/upload", { method: "POST", body }).then((r) => r.json());
      if (!json.success) throw new Error(json.error || "Upload failed");
      setForm((f) => (f ? { ...f, images: [...f.images, json.data.url] } : f));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim()) return setError("Title is required");
    setSaving(true);
    setError("");
    const json = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        seekingDescription: form.isExchange ? form.seekingDescription : null,
      }),
    })
      .then((r) => r.json())
      .catch(() => ({ success: false }));
    setSaving(false);
    if (!json.success) return setError(json.error?.message || "Could not save changes");
    router.push(`/my-drops/show/${id}`);
  };

  return (
    <div className="min-h-full bg-background pb-32 text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex cursor-pointer items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-fg-subtle transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back
        </button>

        <h1 className="mb-10 border-b border-foreground/10 pb-8 text-4xl font-black uppercase tracking-tighter md:text-5xl">
          Edit drop
        </h1>

        {!form ? (
          error ? (
            <p className="text-xs font-bold uppercase tracking-widest text-red-400">{error}</p>
          ) : (
            <Loader2 className="size-5 animate-spin text-fg-subtle" />
          )
        ) : (
          <form onSubmit={save} className="space-y-6">
            <div>
              <label className={labelClass}>Images</label>
              <div className="flex flex-wrap gap-3">
                {form.images.map((src) => (
                  <div key={src} className="group relative size-24 overflow-hidden border border-foreground/10 bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set("images", form.images.filter((i) => i !== src))}
                      className="absolute right-1 top-1 cursor-pointer bg-background/80 p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-foreground/20 text-fg-subtle transition-colors hover:border-foreground/50 hover:text-foreground">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                  <span className="text-[8px] font-black uppercase tracking-widest">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Title</label>
                <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Brand</label>
                <input className={inputClass} value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Condition</label>
                <select className={inputClass} value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Size</label>
                <input className={inputClass} value={form.size} onChange={(e) => set("size", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={5}
                className={`${inputClass} resize-none`}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-[10px] font-black uppercase tracking-widest text-fg-soft">
              <input
                type="checkbox"
                checked={form.isExchange}
                onChange={(e) => set("isExchange", e.target.checked)}
                className="size-4 accent-brand"
              />
              Open to swaps
            </label>
            {form.isExchange && (
              <div>
                <label className={labelClass}>Seeking in return</label>
                <input
                  className={inputClass}
                  value={form.seekingDescription}
                  onChange={(e) => set("seekingDescription", e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex cursor-pointer items-center gap-2 bg-foreground px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-background transition-colors hover:bg-brand disabled:opacity-50 hover:text-black"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save changes
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
