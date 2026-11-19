import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CircleCheck,
  FileSearch2,
  Plus,
  UsersRound,
} from "lucide-react";
import { CompanyDashboardChart } from "@/components/company/company-dashboard-chart";
import { CompanyNotificationReadForm } from "@/components/company/company-notification-read-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/candidate/queries";
import { requireRole } from "@/lib/auth/roles";

export default async function CompanyHomePage() {
  const { supabase, user, profile } = await requireRole("company");
  const { data: memberships, error: membershipsError } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("profile_id", user.id)
    .eq("status", "active");

  if (membershipsError) throw new Error(`Impossible de charger vos entreprises : ${membershipsError.message}`);
  const companyIds = [...new Set((memberships ?? []).map((membership) => membership.company_id))];

  if (companyIds.length === 0) {
    return (
      <div className="space-y-5">
        <p className="text-sm font-semibold text-primary">Espace entreprise</p>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenue{profile.full_name ? `, ${profile.full_name}` : ""}.</h1>
        <Alert variant="info">Terminez la création de votre espace entreprise pour publier des offres et recevoir des candidatures.</Alert>
        <Button asChild><Link href="/company/setup">Configurer mon entreprise</Link></Button>
      </div>
    );
  }

  const [statsResults, activityResults, notificationsResult, unreadResult, jobsResult, companiesResult] = await Promise.all([
    Promise.all(companyIds.map((companyId) => supabase.rpc("company_recruitment_stats", { p_company_id: companyId }))),
    Promise.all(companyIds.map((companyId) => supabase.rpc("company_application_monthly_activity", { p_company_id: companyId }))),
    supabase
      .from("notifications")
      .select("id, title, body, read_at, created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
    supabase
      .from("jobs")
      .select("id, title, status, company_id, created_at")
      .in("company_id", companyIds)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("companies").select("id, name").in("id", companyIds),
  ]);

  statsResults.forEach(({ error }) => {
    if (error) {
      console.error("[company/dashboard] Impossible de charger les statistiques de recrutement.", {
        userId: user.id,
        error: { code: error.code, message: error.message },
      });
    }
  });
  activityResults.forEach(({ error }) => {
    if (error) {
      console.error("[company/dashboard] Impossible de charger l’activité de recrutement.", {
        userId: user.id,
        error: { code: error.code, message: error.message },
      });
    }
  });
  if (notificationsResult.error) {
    console.error("[company/dashboard] Impossible de charger les notifications.", {
      userId: user.id,
      error: { code: notificationsResult.error.code, message: notificationsResult.error.message },
    });
  }
  if (unreadResult.error) {
    console.error("[company/dashboard] Impossible de compter les notifications.", {
      userId: user.id,
      error: { code: unreadResult.error.code, message: unreadResult.error.message },
    });
  }
  if (jobsResult.error) {
    console.error("[company/dashboard] Impossible de charger les offres récentes.", {
      userId: user.id,
      error: { code: jobsResult.error.code, message: jobsResult.error.message },
    });
  }
  if (companiesResult.error) {
    console.error("[company/dashboard] Impossible de charger les entreprises.", {
      userId: user.id,
      error: { code: companiesResult.error.code, message: companiesResult.error.message },
    });
  }

  const total = (key: "total_jobs" | "open_jobs" | "total_applications" | "interviews" | "hires") =>
    statsResults.reduce((sum, result) => sum + (result.data?.[0]?.[key] ?? 0), 0);
  const stats = {
    jobs: total("total_jobs"),
    openJobs: total("open_jobs"),
    applications: total("total_applications"),
    interviews: total("interviews"),
    hires: total("hires"),
  };
  const monthCounts = new Map<string, number>();
  activityResults.forEach(({ data }) => {
    (data ?? []).forEach((row) => {
      monthCounts.set(row.month_start, (monthCounts.get(row.month_start) ?? 0) + row.application_count);
    });
  });
  const chartData = [...monthCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, applications]) => ({
      month: new Intl.DateTimeFormat("fr-TG", { month: "short" }).format(new Date(`${month}T00:00:00`)),
      applications,
    }));
  const companyNames = new Map((companiesResult.data ?? []).map((company) => [company.id, company.name]));

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Espace entreprise</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Bienvenue{profile.full_name ? `, ${profile.full_name}` : ""}.</h1>
          <p className="mt-2 text-muted-foreground">Votre activité de recrutement en un coup d’œil.</p>
        </div>
        <Button asChild><Link href="/company/offres/nouvelle"><Plus aria-hidden="true" className="h-4 w-4" />Publier une offre</Link></Button>
      </div>

      <section aria-label="Actions de recrutement" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink href="/company/offres" icon={BriefcaseBusiness} label="Gérer les offres" />
        <QuickLink href="/company/candidatures" icon={UsersRound} label="Voir les candidatures" />
        <QuickLink href="/company/candidats" icon={FileSearch2} label="Rechercher des profils" />
        <QuickLink href="/company/profil" icon={Building2} label="Profil entreprise" />
      </section>

      <section aria-label="Indicateurs de recrutement" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BriefcaseBusiness} label="Offres publiées" value={stats.openJobs} detail={`${stats.jobs} au total`} />
        <MetricCard icon={UsersRound} label="Candidatures reçues" value={stats.applications} detail="Toutes les offres" />
        <MetricCard icon={CalendarCheck2} label="Entretiens" value={stats.interviews} detail="À suivre dans les candidatures" />
        <MetricCard icon={CircleCheck} label="Recrutements" value={stats.hires} detail="Candidatures retenues" />
      </section>

      <CompanyDashboardChart data={chartData} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Offres récentes</CardTitle>
            <CardDescription>Les dernières annonces de vos entreprises.</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsResult.data?.length ? (
              <div className="divide-y divide-border">
                {jobsResult.data.map((job) => (
                  <article className="flex flex-col justify-between gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center" key={job.id}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{job.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {companyNames.get(job.company_id) ?? "Entreprise"} · Créée le {formatDate(job.created_at)}
                      </p>
                    </div>
                    <Badge variant={job.status === "published" ? "success" : "secondary"}>{job.status === "published" ? "Publiée" : job.status}</Badge>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Vous n’avez pas encore publié d’offre.</p>
                <Button asChild className="mt-3" size="sm"><Link href="/company/offres/nouvelle">Créer une offre</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Notifications récentes</CardTitle>
                <CardDescription className="mt-2">{unreadResult.count ?? 0} non lue{unreadResult.count === 1 ? "" : "s"}</CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost"><Link href="/company/notifications">Tout voir<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {notificationsResult.data?.length ? (
              <div className="divide-y divide-border">
                {notificationsResult.data.map((notification) => (
                  <article className="flex items-start gap-3 py-4 first:pt-0 last:pb-0" key={notification.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={notification.read_at ? "text-sm font-medium" : "text-sm font-semibold"}>{notification.title}</p>
                        {!notification.read_at && <Badge variant="info">Nouvelle</Badge>}
                      </div>
                      {notification.body && <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>}
                      <p className="mt-2 text-xs text-muted-foreground">{formatDate(notification.created_at)}</p>
                    </div>
                    {!notification.read_at && <CompanyNotificationReadForm notificationId={notification.id} />}
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-5 text-sm text-muted-foreground">Les notifications de recrutement apparaîtront ici.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon aria-hidden="true" className="h-5 w-5" /></span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof BriefcaseBusiness;
  label: string;
}) {
  return (
    <Link className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5" href={href}>
      <span className="flex items-center gap-3"><Icon aria-hidden="true" className="h-5 w-5 text-primary" />{label}</span>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
