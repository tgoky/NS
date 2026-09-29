"use client";

import { Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CurrentUserProvider, type ShellUser } from "@/lib/current-user";
import { hidesSidebar } from "@/lib/nav";
import { MobileNav } from "./mobile-nav";
import { NotificationsPanel } from "./notifications-panel";
import { PrimaryRail } from "./primary-rail";
import { SecondarySidebar } from "./secondary-sidebar";
import { TopNav } from "./top-nav";
import { useNotifications } from "./use-notifications";

/**
 * App shell, modelled on mcs-sdk: a global top bar over a
 * rail | sidebar | main | utility-panel split.
 */
export function ShellLayout({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useNotifications();

  return (
    <CurrentUserProvider user={user}>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-fg-soft">
        <Suspense fallback={<div className="h-12 shrink-0 border-b border-foreground/10" />}>
          <TopNav
            onToggleSidebar={() => setSidebarOpen((p) => !p)}
            notificationsOpen={notificationsOpen}
            onToggleNotifications={() => setNotificationsOpen((p) => !p)}
            unreadCount={notifications.unreadCount}
          />
        </Suspense>

        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:flex">
            <PrimaryRail />
          </div>

          {sidebarOpen && !hidesSidebar(pathname) && (
            <div className="hidden md:flex">
              <SecondarySidebar />
            </div>
          )}

          <main className="no-scrollbar relative w-full min-w-0 flex-1 overflow-y-auto bg-background">{children}</main>

          {notificationsOpen && (
            <div className="fixed inset-x-0 bottom-0 top-12 z-40 flex sm:static sm:z-auto">
              <NotificationsPanel state={notifications} onClose={() => setNotificationsOpen(false)} />
            </div>
          )}
        </div>

        <MobileNav unreadCount={notifications.unreadCount} onOpenNotifications={() => setNotificationsOpen(true)} />
      </div>
    </CurrentUserProvider>
  );
}
