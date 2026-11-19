import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Clock3,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { CareerAssistantWidget } from "@/components/candidate/career-assistant-widget";
import { DashboardReveal, CandidateDashboardCharts } from "@/components/candidate/dashboard-visuals";
import { JobCard } from "@/components/candidate/job-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatDate,
  getApplicationCards,
  getCandidateRecord,
  getCandidateSkillNames,
  getRecommendedJobs,
} from "@/lib/candidate/queries";
import { getCandidateAvatarUrl } from "@/lib/candidate/avatar";
import { getSavedJobIds, getSavedJobListings } from "@/lib/jobs/queries";
import { requireRole } from "@/lib/auth/roles";
import type { ApplicationStatus } from "@/types/database";

const applicationStatuses: ApplicationStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
];

const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Envoyée",
  under_review: "En examen",
  shortlisted: "Présélection",
  interview: "Entretien",
  accepted: "Acceptée",
  rejected: "Non retenue",
  withdrawn: "Retirée",
};

const statusColors: Record<ApplicationStatus, string> = {
  submitted: "#2563eb",
  under_review: "#f59e0b",
  shortlisted: "#06b6d4",
  interview: "#8b5cf6",
  accepted: "#10b981",
  rejected: "#ef4444",
  withdrawn: "#94a3b8",
};

type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  date: string;
  href: string;
  icon: "application" | "saved" | "notification";
};

function applicationTrend(applications: Awaited<ReturnType<typeof getApplicationCards>>) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const year = date.getUTCFullYear();
    const monthIndex = date.getUTCMonth();
    const count = applications.filter((application) => {
      const submittedAt = new Date(application.submitted_at);
      return submittedAt.getUTCFullYear() === year && submittedAt.getUTCMonth() === monthIndex;
    }).length;

    return {
      month: new Intl.DateTimeFormat("fr-TG", { month: "short", timeZone: "UTC" })
        .format(date)
        .replace(".", ""),
      count,
    };
  });

  return months;
}

function ActivityIcon({ type }: { type: DashboardActivity["icon"] }) {
  const Icon = type === "application" ? BriefcaseBusiness : type === "saved" ? Bookmark : Bell;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon aria-hidden="true" className="h-4 w-4" />
    </span>
  );
}

export async function CandidateDashboard() {
  const { supabase, user, profile } = await requireRole("candidate");
  const [
    candidate,
    applications,
    recommendedJobs,
    skillNames,
    savedJobs,
    resumesResult,
    notificationsResult,
    experienceResult,
    educationResult,
    unreadResult,
  ] = await Promise.all([
    getCandidateRecord(supabase, user.id),
    getApplicationCards(supabase, user.id),
    getRecommendedJobs(supabase, user.id, 5),
    getCandidateSkillNames(supabase, user.id),
    getSavedJobListings(supabase, user.id),
    supabase.from("resumes").select("id").eq("candidate_id", user.id),
    supabase
      .from("notifications")
      .select("id, title, body, created_at, read_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("experiences").select("id").eq("candidate_id", user.id).limit(1),
    supabase.from("education").select("id").eq("candidate_id", user.id).limit(1),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  if (resumesResult.error) throw new Error(`Unable to load resumes: ${resumesResult.error.message}`);
  if (notificationsResult.error) throw new Error(`Unable to load notifications: ${notificationsResult.error.message}`);
  if (experienceResult.error) throw new Error(`Unable to load experience records: ${experienceResult.error.message}`);
  if (educationResult.error) throw new Error(`Unable to load education records: ${educationResult.error.message}`);
  if (unreadResult.error) throw new Error(`Unable to count notifications: ${unreadResult.error.message}`);

  const savedRecommendedJobIds = await getSavedJobIds(
    supabase,
    user.id,
    recommendedJobs.map((job) => job.id),
  );
  const completionItems = [
    Boolean(profile.full_name),
    Boolean(candidate?.headline),
    Boolean(candidate?.summary),
    Boolean(candidate?.city),
    skillNames.length > 0,
    (experienceResult.data?.length ?? 0) > 0 || (educationResult.data?.length ?? 0) > 0,
    (resumesResult.data?.length ?? 0) > 0,
  ];
  const completedItems = completionItems.filter(Boolean).length;
  const completion = Math.round((completedItems / completionItems.length) * 100);
  const interviewCount = applications.filter((application) => application.status === "interview").length;
  const unreadCount = unreadResult.count ?? 0;
  const greetingName = candidate?.display_name || profile.full_name.split(" ")[0] || "Candidat";
  const avatarUrl = await getCandidateAvatarUrl(supabase, user.id, candidate?.photo_url ?? null);
  const statusCounts = applicationStatuses
    .map((status) => ({
      label: statusLabels[status],
      count: applications.filter((application) => application.status === status).length,
      color: statusColors[status],
    }))
    .filter((status) => status.count > 0);

  const activities: DashboardActivity[] = [
    ...applications.slice(0, 4).map((application) => ({
      id: `application-${application.id}`,
      title: "Candidature envoyée",
      description: application.job
        ? `${application.job.title} · ${application.job.companyName}`
        : "Une nouvelle candidature a été enregistrée.",
      date: application.submitted_at,
      href: "/candidate/candidatures",
      icon: "application" as const,
    })),
    ...savedJobs.jobs.slice(0, 4).map((job) => ({
      id: `saved-${job.id}`,
      title: "Offre sauvegardée",
      description: `${job.title} · ${job.companyName}`,
      date: job.savedAt,
      href: `/candidate/offres/${job.slug}`,
      icon: "saved" as const,
    })),
    ...(notificationsResult.data ?? []).map((notification) => ({
      id: `notification-${notification.id}`,
      title: notification.title,
      description: notification.body ?? "Vous avez reçu une notification.",
      date: notification.created_at,
      href: "/candidate/notifications",
      icon: "notification" as const,
    })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-7">
      <DashboardReveal>
        <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-700 p-6 text-white shadow-lg shadow-blue-950/10 sm:p-8">
          <div aria-hidden="true" className="absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <Badge className="border-white/20 bg-white/10 text-blue-50" variant="outline">
                <Sparkles aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                Votre espace carrière
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Bonjour, {greetingName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-blue-100 sm:text-base">
                Votre prochaine opportunité commence par un profil soigné et un suivi régulier.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-white text-blue-900 hover:bg-blue-50">
              <Link href="/candidate/offres">
                Explorer les offres <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </DashboardReveal>

      <DashboardReveal delay={0.04}>
        <section aria-label="Statistiques candidat" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            description="Depuis votre inscription"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            label="Candidatures"
            value={applications.length}
          />
          <StatCard
            description="À suivre dans votre espace"
            icon={<Sparkles className="h-4 w-4" />}
            label="Entretiens"
            value={interviewCount}
          />
          <StatCard
            description="À consulter plus tard"
            icon={<Bookmark className="h-4 w-4" />}
            label="Offres sauvegardées"
            value={savedJobs.total}
          />
          <StatCard
            description="À consulter"
            icon={<Bell className="h-4 w-4" />}
            label="Notifications non lues"
            value={unreadCount}
          />
        </section>
      </DashboardReveal>

      <DashboardReveal delay={0.06}>
        <CareerAssistantWidget
          headline={candidate?.headline ?? null}
          recommendedJobCount={recommendedJobs.length}
          skills={skillNames}
          summary={candidate?.summary ?? null}
          userName={candidate?.display_name || profile.full_name}
        />
      </DashboardReveal>

      <DashboardReveal delay={0.08}>
        <CandidateDashboardCharts
          applicationCount={applications.length}
          statuses={statusCounts}
          trend={applicationTrend(applications)}
        />
      </DashboardReveal>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <div className="space-y-6">
          <DashboardReveal delay={0.12}>
            <Card id="offres-recommandees">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Offres recommandées</CardTitle>
                  <CardDescription className="mt-1">Des opportunités récentes à découvrir.</CardDescription>
                </div>
                <Button asChild className="shrink-0" size="sm" variant="ghost">
                  <Link href="/candidate/offres">
                    Tout voir <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3">
                {recommendedJobs.length ? (
                  recommendedJobs.map((job) => (
                    <JobCard
                      initialSaved={savedRecommendedJobIds.has(job.id)}
                      job={job}
                      key={job.id}
                      showActions
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<BriefcaseBusiness className="h-5 w-5" />}
                    title="Aucune offre pour le moment"
                    description="Les nouvelles offres apparaîtront ici. Complétez vos compétences pour recevoir de meilleures recommandations."
                    href="/candidate/profil"
                    linkLabel="Compléter mon profil"
                  />
                )}
              </CardContent>
            </Card>
          </DashboardReveal>

          <DashboardReveal delay={0.16}>
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Offres sauvegardées</CardTitle>
                  <CardDescription className="mt-1">Vos opportunités à retrouver facilement.</CardDescription>
                </div>
                <Button asChild className="shrink-0" size="sm" variant="ghost">
                  <Link href="/candidate/offres/sauvegardees">
                    Tout voir <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {savedJobs.jobs.length ? (
                  <div className="divide-y divide-border">
                    {savedJobs.jobs.slice(0, 3).map((job) => (
                      <Link
                        className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                        href={`/candidate/offres/${job.slug}`}
                        key={job.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{job.title}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{job.companyName}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">Ajoutée le</p>
                          <p className="mt-1 text-xs font-medium">{formatDate(job.savedAt)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Bookmark className="h-5 w-5" />}
                    title={savedJobs.total ? "Offres indisponibles" : "Aucune offre sauvegardée"}
                    description={savedJobs.total
                      ? "Vos anciennes sauvegardes ne sont plus publiées."
                      : "Enregistrez les offres qui vous intéressent pour les retrouver ici."}
                    href="/candidate/offres"
                    linkLabel="Découvrir les offres"
                  />
                )}
              </CardContent>
            </Card>
          </DashboardReveal>

          <DashboardReveal delay={0.2}>
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Dernières candidatures</CardTitle>
                  <CardDescription className="mt-1">Suivez l’avancement de vos démarches.</CardDescription>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/candidate/candidatures">
                    Historique <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {applications.length ? (
                  <div className="divide-y divide-border">
                    {applications.slice(0, 4).map((application) => (
                      <div
                        className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        key={application.id}
                      >
                        <div className="min-w-0">
                          {application.job ? (
                            <Link
                              className="font-semibold text-foreground hover:text-primary"
                              href={`/candidate/offres/${application.job.slug}`}
                            >
                              {application.job.title}
                            </Link>
                          ) : (
                            <p className="font-semibold">Offre d’emploi</p>
                          )}
                          <p className="mt-1 text-sm text-muted-foreground">
                            {application.job?.companyName ?? "Entreprise"} · {formatDate(application.submitted_at)}
                          </p>
                        </div>
                        <ApplicationStatusBadge status={application.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="h-5 w-5" />}
                    title="Pas encore de candidature"
                    description="Explorez les offres et postulez à celles qui vous correspondent."
                    href="/candidate/offres"
                    linkLabel="Découvrir les offres"
                  />
                )}
              </CardContent>
            </Card>
          </DashboardReveal>
        </div>

        <aside className="space-y-6">
          <DashboardReveal delay={0.12}>
            <Card className="overflow-hidden">
              <div aria-hidden="true" className="h-20 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-500" />
              <CardContent className="px-5 pb-5 pt-0">
                <div className="-mt-9 flex items-end justify-between gap-3">
                  <Avatar
                    className="h-[72px] w-[72px] border-4 border-card bg-card text-xl"
                    imageUrl={avatarUrl}
                    name={candidate?.display_name || profile.full_name}
                  />
                  <Badge className="mb-1" variant={completion === 100 ? "success" : "info"}>
                    {completion}% complété
                  </Badge>
                </div>
                <h2 className="mt-3 text-lg font-bold tracking-tight">
                  {candidate?.display_name || profile.full_name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {candidate?.headline || "Ajoutez votre titre professionnel"}
                </p>
                {candidate?.city && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                    {candidate.city}
                  </p>
                )}
                {skillNames.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {skillNames.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                    {skillNames.length > 4 && <Badge variant="outline">+{skillNames.length - 4}</Badge>}
                  </div>
                )}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium">Profil professionnel</span>
                    <span className="text-muted-foreground">{completedItems}/{completionItems.length}</span>
                  </div>
                  <Progress value={completion} />
                </div>
                <Button asChild className="mt-4 w-full" variant="secondary">
                  <Link href="/candidate/profil">
                    Modifier mon profil <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </DashboardReveal>

          <DashboardReveal delay={0.16}>
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Notifications récentes</CardTitle>
                  <CardDescription className="mt-1">Les dernières nouvelles de votre compte.</CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="info">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Badge>
                )}
              </CardHeader>
              <CardContent>
                {notificationsResult.data?.length ? (
                  <div className="space-y-4">
                    {notificationsResult.data.map((notification) => (
                      <Link className="flex gap-3" href="/candidate/notifications" key={notification.id}>
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read_at ? "bg-muted-foreground/40" : "bg-primary"}`} />
                        <span className="min-w-0">
                          <span className="line-clamp-2 block text-sm font-medium">{notification.title}</span>
                          {notification.body && (
                            <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{notification.body}</span>
                          )}
                          <span className="mt-1 block text-xs text-muted-foreground">{formatDate(notification.created_at)}</span>
                        </span>
                      </Link>
                    ))}
                    <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary" href="/candidate/notifications">
                      Voir toutes les notifications <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Vous êtes à jour. Aucune notification pour l’instant.</p>
                )}
              </CardContent>
            </Card>
          </DashboardReveal>

          <DashboardReveal delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Activités récentes</CardTitle>
                <CardDescription className="mt-1">Votre recherche d’emploi en un coup d’œil.</CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length ? (
                  <ol className="space-y-4">
                    {activities.map((activity, index) => (
                      <li className="relative flex gap-3" key={activity.id}>
                        {index < activities.length - 1 && (
                          <span aria-hidden="true" className="absolute bottom-[-18px] left-[17px] top-9 w-px bg-border" />
                        )}
                        <ActivityIcon type={activity.icon} />
                        <Link className="min-w-0 flex-1" href={activity.href}>
                          <span className="block text-sm font-semibold">{activity.title}</span>
                          <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{activity.description}</span>
                          <span className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 aria-hidden="true" className="h-3 w-3" />
                            {formatDate(activity.date)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">Vos candidatures et sauvegardes apparaîtront ici.</p>
                )}
              </CardContent>
            </Card>
          </DashboardReveal>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {icon}
      </span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-4" size="sm" variant="secondary">
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </div>
  );
}
