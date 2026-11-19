import Link from "next/link";
import { ArrowUpRight, LogOut, Search } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { CandidateNavigation } from "@/components/candidate/candidate-navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function CandidateShell({
  children,
  name,
  email,
  avatarUrl,
}: {
  children: React.ReactNode;
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="candidate-theme min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-bold tracking-tight text-foreground" href="/candidate">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground">J</span>
            <span>JOB-CENTER</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild className="hidden sm:inline-flex" size="sm" variant="outline">
              <Link href="/candidate/offres">
                <Search aria-hidden="true" className="h-4 w-4" />
                Rechercher un emploi
              </Link>
            </Button>
            <NotificationBell href="/candidate/notifications" label="Notifications" />
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar className="h-9 w-9" imageUrl={avatarUrl} name={name} />
              <div className="max-w-40">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <form action={signOutAction}>
              <Button aria-label="Déconnexion" className="h-9 px-3" size="sm" type="submit" variant="ghost">
                <LogOut aria-hidden="true" className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-[1440px] border-t border-border md:hidden">
          <CandidateNavigation />
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 md:grid-cols-[230px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="sticky top-24 hidden h-fit rounded-xl border border-border bg-card p-3 md:block">
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-secondary/60 px-3 py-3">
            <Avatar className="h-10 w-10" imageUrl={avatarUrl} name={name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="mb-4 rounded-lg border border-primary/15 bg-primary/5 p-3">
            <p className="text-sm font-semibold">Boostez votre profil</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Un profil à jour vous aide à ressortir auprès des recruteurs.
            </p>
            <Link className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary" href="/candidate/profil">
              Compléter mon profil <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Espace candidat
          </p>
          <CandidateNavigation />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
