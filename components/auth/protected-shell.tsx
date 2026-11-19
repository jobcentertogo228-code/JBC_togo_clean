import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { JobCenterBrand } from "@/components/brand/job-center-brand";

export function ProtectedShell({
  children,
  title,
  home,
  notificationHref,
  navigationLinks = [],
}: {
  children: React.ReactNode;
  title: string;
  home: string;
  notificationHref?: string;
  navigationLinks?: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="page-shell">
      <header className="site-header">
        <JobCenterBrand href={home} />
        <nav className="site-nav" aria-label="Navigation de l’espace">
          <span className="muted">{title}</span>
          {navigationLinks.map((item) => (
            <Link className="text-sm font-medium hover:text-primary" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          {notificationHref && <NotificationBell href={notificationHref} label="Notifications" />}
          <form action={signOutAction}>
            <button className="button button-secondary" type="submit">Déconnexion</button>
          </form>
        </nav>
      </header>
      <main className="main-content">{children}</main>
      <footer className="site-footer">Votre espace sécurisé JOB-CENTER</footer>
    </div>
  );
}
