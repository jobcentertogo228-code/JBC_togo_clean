"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotificationRealtime } from "@/components/notifications/notification-realtime-provider";

export function NotificationBell({ href, label }: { href: string; label: string }) {
  const { unreadCount } = useNotificationRealtime();

  return (
    <Link
      aria-label={unreadCount ? `${label}, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : label}
      className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary"
      href={href}
    >
      <Bell aria-hidden="true" className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
