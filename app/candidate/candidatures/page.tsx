import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getApplicationCards } from "@/lib/candidate/queries";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Historique des candidatures" };

export default async function CandidateApplicationsPage() {
  const { supabase, user } = await requireRole("candidate");
  const applications = await getApplicationCards(supabase, user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Mon espace candidat</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Mes candidatures</h1>
        <p className="mt-2 text-muted-foreground">Retrouvez l’historique et l’état de vos candidatures.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>{applications.length} candidature{applications.length > 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length ? (
            <div className="divide-y divide-border">
              {applications.map((application) => (
                <article className="flex flex-col justify-between gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center" key={application.id}>
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><BriefcaseBusiness className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      {application.job ? (
                        <Link className="font-semibold text-foreground hover:text-primary" href={`/candidate/offres/${application.job.slug}`}>
                          {application.job.title}
                        </Link>
                      ) : (
                        <p className="font-semibold">Offre d’emploi indisponible</p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">{application.job?.companyName ?? "Entreprise"}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" /> Envoyée le {formatDate(application.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </article>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <BriefcaseBusiness className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">Aucune candidature pour le moment</h2>
              <p className="mt-1 text-sm text-muted-foreground">Explorez les offres et postulez en quelques étapes.</p>
              <Button asChild className="mt-4"><Link href="/candidate/offres">Découvrir les offres</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
      {applications.some((application) => application.job === null) && (
        <Alert variant="warning">
          Certaines offres ne sont plus disponibles. L’historique de votre candidature reste conservé.
        </Alert>
      )}
    </div>
  );
}
