"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationRealtimeEvent = {
  eventType: "INSERT" | "UPDATE";
  notification: NotificationRow;
};

type NotificationRealtimeValue = {
  unreadCount: number;
  events: NotificationRealtimeEvent[];
};

const NotificationRealtimeContext = createContext<NotificationRealtimeValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNotification(value: unknown): NotificationRow | null {
  if (!isRecord(value)) return null;

  const { id, recipient_id, type, title, body, payload, read_at, created_at } = value;
  if (
    typeof id !== "string"
    || typeof recipient_id !== "string"
    || typeof type !== "string"
    || typeof title !== "string"
    || !(body === null || typeof body === "string")
    || !("payload" in value)
    || !(read_at === null || typeof read_at === "string")
    || typeof created_at !== "string"
  ) {
    return null;
  }

  return { id, recipient_id, type, title, body, payload, read_at, created_at };
}

function parseReadAt(value: unknown): string | null | undefined {
  if (!isRecord(value) || !("read_at" in value)) return undefined;
  return value.read_at === null || typeof value.read_at === "string" ? value.read_at : undefined;
}

export function NotificationRealtimeProvider({
  children,
  userId,
  initialUnreadCount,
}: {
  children: React.ReactNode;
  userId: string;
  initialUnreadCount: number;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [events, setEvents] = useState<NotificationRealtimeEvent[]>([]);
  const notificationReadAt = useRef(new Map<string, string | null>());

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") return;
          const notification = parseNotification(payload.new);
          if (!notification || notification.recipient_id !== userId) return;

          if (payload.eventType === "INSERT") {
            if (notificationReadAt.current.has(notification.id)) return;
            notificationReadAt.current.set(notification.id, notification.read_at);
            if (!notification.read_at) setUnreadCount((count) => count + 1);
          } else {
            const previousReadAt = notificationReadAt.current.has(notification.id)
              ? notificationReadAt.current.get(notification.id)
              : parseReadAt(payload.old);

            if (previousReadAt === notification.read_at) return;
            notificationReadAt.current.set(notification.id, notification.read_at);
            if (previousReadAt === null && notification.read_at !== null) {
              setUnreadCount((count) => Math.max(0, count - 1));
            } else if (previousReadAt !== undefined && previousReadAt !== null && notification.read_at === null) {
              setUnreadCount((count) => count + 1);
            }
          }

          setEvents((current) => [
            { eventType: payload.eventType, notification },
            ...current,
          ].slice(0, 100));
        },
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Supabase Realtime notifications subscription failed:", error ?? status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <NotificationRealtimeContext.Provider value={{ unreadCount, events }}>
      {children}
    </NotificationRealtimeContext.Provider>
  );
}

export function useNotificationRealtime() {
  const context = useContext(NotificationRealtimeContext);
  if (!context) throw new Error("NotificationRealtimeProvider is missing from this layout.");
  return context;
}
