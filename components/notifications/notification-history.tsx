"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationReadForm } from "@/components/candidate/notification-read-form";
import { CompanyNotificationReadForm } from "@/components/company/company-notification-read-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/candidate/queries";
import { useNotificationRealtime } from "@/components/notifications/notification-realtime-provider";
import type { NotificationRow } from "@/components/notifications/notification-realtime-provider";

function notificationHref(notification: NotificationRow, audience: "candidate" | "company") {
  if (audience === "company") return "/company/candidatures";
  if (notification.type === "new_job" && typeof notification.payload === "object" && notification.payload !== null) {
    const slug = "job_slug" in notification.payload ? notification.payload.job_slug : null;
    if (typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return `/emplois/${slug}`;
  }
  return "/candidate/candidatures";
}

export function NotificationHistory({
  audience,
  initialNotifications,
}: {
  audience: "candidate" | "company";
  initialNotifications: NotificationRow[];
}) {
  const { events, unreadCount } = useNotificationRealtime();
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    setNotifications((current) => {
      const byId = new Map(current.map((notification) => [notification.id, notification]));
      for (const notification of initialNotifications) byId.set(notification.id, notification);
      for (const event of [...events].reverse()) byId.set(event.notification.id, event.notification);
      return [...byId.values()].sort((left, right) => right.created_at.localeCompare(left.created_at));
    });
  }, [initialNotifications, events]);

  const unreadInHistory = notifications.filter((notification) => !notification.read_at).length;
  const unread = Math.max(unreadCount, unreadInHistory);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Historique</CardTitle>
            <CardDescription className="mt-2">
              {notifications.length} notification{notifications.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          {unread > 0 && <Badge variant="info">{unread} non lue{unread === 1 ? "" : "s"}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length ? (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <article className="flex items-start gap-4 py-5 first:pt-0 last:pb-0" key={notification.id}>
                <span className={`mt-1 rounded-full p-2 ${notification.read_at ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  {notification.read_at
                    ? <CheckCheck aria-hidden="true" className="h-4 w-4" />
                    : <Bell aria-hidden="true" className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={notification.read_at ? "text-sm font-medium" : "text-sm font-semibold"}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{notification.body}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(notification.created_at)}</p>
                  <Link
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    href={notificationHref(notification, audience)}
                  >
                    {notification.type === "new_job" ? "Consulter l’offre" : "Voir les détails"}
                  </Link>
                </div>
                {!notification.read_at && (
                  audience === "candidate"
                    ? <NotificationReadForm notificationId={notification.id} />
                    : <CompanyNotificationReadForm notificationId={notification.id} />
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Bell aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">Vous êtes à jour</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vos notifications apparaîtront ici.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
