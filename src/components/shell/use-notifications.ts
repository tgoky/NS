"use client";

import { useCallback } from "react";
import useSWR from "swr";

export type NotificationItem = {
  id: string;
  itemId: string | null;
  requestId?: string | null;
  user: string;
  message: string;
  time: string;
  type: string;
  isRead: boolean;
};

const fetcher = async (url: string): Promise<NotificationItem[]> => {
  const json = await fetch(url).then((r) => r.json());
  return json.success ? json.data : [];
};

export function useNotifications() {
  const { data, isLoading, mutate } = useSWR("/api/notifications", fetcher, { refreshInterval: 60_000 });
  const notifications = data ?? [];

  const markAllRead = useCallback(async () => {
    await mutate(
      async (current) => {
        await fetch("/api/notifications", { method: "PATCH" });
        return (current ?? []).map((n) => ({ ...n, isRead: true }));
      },
      { optimisticData: (current) => (current ?? []).map((n) => ({ ...n, isRead: true })), revalidate: false },
    );
  }, [mutate]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return { notifications, loaded: !isLoading, unreadCount, refresh: () => mutate(), markAllRead };
}

export type NotificationsState = ReturnType<typeof useNotifications>;

/** Where a notification should take its recipient. */
export function notificationHref(n: NotificationItem): string | null {
  // Delivery updates go to the receiver's tracker.
  if (n.type === "DELIVERY_UPDATE" && n.requestId) return `/my-requests/delivery/${n.requestId}`;
  if (!n.itemId) return null;
  // Activity on something the user owns goes to their drop manager.
  if (["REQUEST", "COMMENT", "DELIVERED", "DISPUTE"].includes(n.type) && n.message.includes("your")) {
    return `/my-drops/show/${n.itemId}`;
  }
  return `/list-stuffs/show/${n.itemId}`;
}
