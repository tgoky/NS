import { initialsOf, type ShellUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

export function UserAvatar({ user, className }: { user: ShellUser; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-foreground/15 bg-surface-2 text-[10px] font-black text-foreground",
        className,
      )}
    >
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar} alt={user.username} className="size-full object-cover" />
      ) : (
        initialsOf(user)
      )}
    </span>
  );
}
