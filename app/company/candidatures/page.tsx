import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays } from "lucide-react";
import { ApplicationStatusForm } from "@/components/company/application-status-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/candidate/queries";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Candidatures reçues" };

export default async function CompanyApplicationsPage() {
  const { supabase, user } = await requireRole("company");
  const { data: memberships, error: membershipsError } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("profile_id", user.id)
    .eq("status", "active");

  if (membershipsError) {
    throw new Error(`Impossible de charger vos entreprises : ${membershipsError.message}`);
  }

  const companyIds = [...new Set((memberships ?? []).map((membership) => membership.company_id))];
  const { data: jobs, error: jobsError } = companyIds.length
    ? await supabase.from("jobs").select("id, title, company_id").in("company_id", companyIds)
    : { data: [], error: null };

  if (jobsError) throw new Error(`Impossible de charger vos offres : ${jobsError.message}`);

  const jobIds = (jobs ?? []).map((job) => job.id);
  const { data: applications, error: applicationsError } = jobIds.length
    ? await supabase
      .from("applications")
      .select("id, job_id, candidate_id, status, interview_at, submitted_at")
      .in("job_id", jobIds)
      .order("submitted_at", { ascending: false })
      .limit(100)
    : { data: [], error: null };

  if (applicationsError) {
    throw new Error(`Impossible de charger les candidatures : ${applicationsError.message}`);
  }

  const candidateIds = [...new Set((applications ?? []).map((application) => application.candidate_id))];
  const companyIdsForJobs = [...new Set((jobs ?? []).map((job) => job.company_id))];
  const [candidatesResult, companiesResult] = await Promise.all([
    candidateIds.length
      ? supabase
        .from("candidates")
        .select("profile_id, display_name, headline, city")
        .in("profile_id", candidateIds)
      : Promise.resolve({ data: [], error: null }),
    companyIdsForJobs.length
      ? supabase.from("companies").select("id, name").in("id", companyIdsForJobs)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (candidatesResult.error) {
    throw new Error(`Impossible de charger les profils des candidats : ${candidatesResult.error.message}`);
  }
  if (companiesResult.error) {
    throw new Error(`Impossible de charger les entreprises : ${companiesResult.error.message}`);
  }

  const jobById = new Map((jobs ?? []).map((job) => [job.id, job]));
  const candidateById = new Map((candidatesResult.data ?? []).map((candidate) => [candidate.profile_id, candidate]));
  const companyById = new Map((companiesResult.data ?? []).map((company) => [company.id, company.name]));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Espace entreprise</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Candidatures reçues</h1>
        <p className="mt-2 text-muted-foreground">Les candidatures à vos offres, des plus récentes aux plus anciennes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des candidatures</CardTitle>
          <CardDescription>
            {(applications ?? []).length} candidature{(applications ?? []).length === 1 ? "" : "s"}
            {(applications ?? []).length === 100 ? " récentes affichées" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications?.length ? (
            <div className="divide-y divide-border">
              {applications.map((application) => {
                const job = jobById.get(application.job_id);
                const candidate = candidateById.get(application.candidate_id);

                return (
                  <article className="flex flex-col justify-between gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center" key={application.id}>
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="rounded-lg bg-blue-50 p-2.5 text-primary">
                        <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{candidate?.display_name || "Candidat"}</p>
                        {candidate?.headline && <p className="mt-1 text-sm text-muted-foreground">{candidate.headline}</p>}
                        <p className="mt-1 text-sm text-muted-foreground">
                          {job ? (
                            <>
                              Pour <span className="font-medium text-foreground">{job.title}</span>
                              {" · "}{companyById.get(job.company_id) ?? "Entreprise"}
                            </>
                          ) : "Offre d’emploi indisponible"}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                          Reçue le {formatDate(application.submitted_at)}
                          {candidate?.city ? ` · ${candidate.city}` : ""}
                        </p>
                      </div>
                    </div>
                    <ApplicationStatusForm
                      applicationId={application.id}
                      initialStatus={application.status}
                      interviewAt={application.interview_at}
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <BriefcaseBusiness aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">Aucune candidature pour le moment</h2>
              <p className="mt-1 text-sm text-muted-foreground">Les candidatures reçues apparaîtront ici.</p>
              <Button asChild className="mt-4"><Link href="/company/offres/nouvelle">Publier une offre</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Alert variant="info">
        Les candidats ne sont visibles ici que s’ils ont postulé à l’une de vos offres.
      </Alert>
    </div>
  );
}
