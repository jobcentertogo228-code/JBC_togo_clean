import type { Metadata } from "next";
import { NotificationHistory } from "@/components/notifications/notification-history";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Notifications entreprise" };

export default async function CompanyNotificationsPage() {
  const { supabase, user } = await requireRole("company");
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, recipient_id, type, title, body, payload, read_at, created_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load company notifications: ${error.message}`);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Espace entreprise</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-2 text-muted-foreground">Les événements de recrutement liés à votre compte.</p>
      </div>
      <NotificationHistory audience="company" initialNotifications={notifications ?? []} />
    </div>
  );
}
