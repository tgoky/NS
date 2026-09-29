"use client";

import { useState } from "react";
import { Loader2, Power } from "lucide-react";
import { signOut } from "./sign-out";

export function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 border border-foreground/20 bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center p-8 text-center">
          <Power className="mb-4 size-6 text-foreground" strokeWidth={1.5} />
          <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-foreground">Terminate Session</h3>
          <p className="mb-8 text-[9px] font-bold uppercase tracking-[0.2em] text-fg-subtle">
            Confirm your departure from the archive.
          </p>
          <div className="flex w-full gap-3">
            <button
              type="button"
              className="flex-1 cursor-pointer border border-foreground/10 py-3 text-[10px] font-black uppercase tracking-widest text-fg-muted transition-all hover:border-foreground/30 hover:text-foreground"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className="flex flex-1 cursor-pointer items-center justify-center bg-foreground py-3 text-[10px] font-black uppercase tracking-widest text-background transition-all hover:bg-foreground/80 disabled:opacity-60"
              onClick={async () => {
                setPending(true);
                await signOut();
              }}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
