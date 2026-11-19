import { ProtectedShell } from "@/components/auth/protected-shell";
import { NotificationRealtimeProvider } from "@/components/notifications/notification-realtime-provider";
import { requireRole } from "@/lib/auth/roles";

export default async function CompanyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { supabase, user } = await requireRole("company");
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[company/layout] Impossible de compter les notifications.", {
      userId: user.id,
      error: { code: error.code, message: error.message },
    });
  }

  return (
    <NotificationRealtimeProvider initialUnreadCount={count ?? 0} userId={user.id}>
      <ProtectedShell
        navigationLinks={[
          { href: "/company/offres", label: "Offres" },
          { href: "/company/candidatures", label: "Candidatures" },
          { href: "/company/candidats", label: "Candidats" },
          { href: "/company/profil", label: "Entreprise" },
        ]}
        notificationHref="/company/notifications"
        title="Espace entreprise"
        home="/company"
      >
        {children}
      </ProtectedShell>
    </NotificationRealtimeProvider>
  );
}
