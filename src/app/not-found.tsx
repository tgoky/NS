import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fg-faint">Error 404</p>
      <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground">
        Nothing <span className="italic text-fg-subtle">dropped</span> here
      </h1>
      <p className="max-w-sm text-xs font-medium tracking-wide text-fg-subtle">
        The page you&apos;re looking for doesn&apos;t exist or was claimed by someone else.
      </p>
      <Link
        href="/drops"
        className="bg-foreground px-6 py-3 text-[10px] font-black uppercase tracking-widest text-background transition-colors hover:bg-brand hover:text-black"
      >
        Back to the feed
      </Link>
    </div>
  );
}
