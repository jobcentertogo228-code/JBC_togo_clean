import type { Metadata } from "next";
import Link from "next/link";
import { Archive, BriefcaseBusiness, Plus, SquarePen } from "lucide-react";
import { ArchiveJobForm, DeleteJobForm } from "@/components/company/job-management-actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/candidate/queries";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Gestion des offres" };

export default async function CompanyJobsPage() {
  const { supabase, user } = await requireRole("company");
  const { data: memberships, error: membershipsError } = await supabase
    .from("company_memberships")
    .select("company_id, role")
    .eq("profile_id", user.id)
    .eq("status", "active");
  if (membershipsError) {
    console.error("[company/offres] Supabase query failed", {
      userId: user.id,
      role: "company",
      query: "company_memberships",
      error: {
        code: membershipsError.code,
        message: membershipsError.message,
        details: membershipsError.details,
        hint: membershipsError.hint,
      },
    });
  }

  const companyIds = [...new Set((memberships ?? []).map((membership) => membership.company_id))];
  const [jobsResult, companiesResult] = await Promise.all([
    companyIds.length && !membershipsError
      ? supabase
        .from("jobs")
        .select("id, reference_code, company_id, title, slug, status, published_at, closes_at, created_at")
        .in("company_id", companyIds)
        .order("created_at", { ascending: false })
        .limit(200)
      : Promise.resolve({ data: [], error: null }),
    companyIds.length && !membershipsError
      ? supabase.from("companies").select("id, name").in("id", companyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const [query, error] of [
    ["jobs", jobsResult.error],
    ["companies", companiesResult.error],
  ] as const) {
    if (error) {
      console.error("[company/offres] Supabase query failed", {
        userId: user.id,
        role: "company",
        companyIds,
        query,
        error: { code: error.code, message: error.message, details: error.details, hint: error.hint },
      });
    }
  }
  const loadError = membershipsError ?? jobsResult.error ?? companiesResult.error;

  const names = new Map((companiesResult.data ?? []).map((company) => [company.id, company.name]));
  const roles = new Map((memberships ?? []).map((membership) => [membership.company_id, membership.role]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Espace entreprise</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Gestion des offres</h1>
          <p className="mt-2 text-muted-foreground">Modifiez, archivez ou supprimez vos offres et suivez leur publication.</p>
        </div>
        <Button asChild><Link href="/company/offres/nouvelle"><Plus aria-hidden="true" className="h-4 w-4" />Nouvelle offre</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos annonces</CardTitle>
          <CardDescription>
            {loadError
              ? "Les données des offres ne sont pas disponibles pour le moment."
              : `${jobsResult.data?.length ?? 0} offre${jobsResult.data?.length === 1 ? "" : "s"} affichée${jobsResult.data?.length === 1 ? "" : "s"} (200 maximum).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <Alert variant="warning">Impossible de charger les offres pour le moment. Réessayez en actualisant la page.</Alert>
          ) : jobsResult.data?.length ? (
            <div className="space-y-3">
              {jobsResult.data.map((job) => {
                const canManage = ["owner", "admin", "recruiter"].includes(roles.get(job.company_id) ?? "");
                return (
                  <article className="rounded-xl border border-border p-4" key={job.id}>
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><BriefcaseBusiness aria-hidden="true" className="h-5 w-5" /></span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate font-semibold">{job.title}</h2>
                            <Badge variant={job.status === "published" ? "success" : job.status === "archived" ? "secondary" : "warning"}>{statusLabel(job.status)}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {job.reference_code} · {names.get(job.company_id) ?? "Entreprise"} · Créée le {formatDate(job.created_at)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {job.published_at ? `Publiée le ${formatDate(job.published_at)}` : "Non publiée"}
                            {job.closes_at ? ` · Fin ${formatDate(job.closes_at)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {job.status === "published" && (
                          <Button asChild size="sm" variant="outline"><Link href={`/emplois/${job.slug}`}>Voir l’annonce</Link></Button>
                        )}
                        {canManage && !["archived", "closed"].includes(job.status) && (
                          <>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/company/offres/${job.id}`}><SquarePen aria-hidden="true" className="h-4 w-4" />Modifier</Link>
                            </Button>
                            <ArchiveJobForm jobId={job.id} />
                          </>
                        )}
                        {canManage && ["draft", "archived"].includes(job.status) && (
                          <DeleteJobForm jobId={job.id} />
                        )}
                        {job.status === "archived" && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Archive aria-hidden="true" className="h-3.5 w-3.5" />Archivée</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <BriefcaseBusiness aria-hidden="true" className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">Aucune offre créée</h2>
              <p className="mt-1 text-sm text-muted-foreground">Publiez votre première annonce pour recevoir des candidatures.</p>
              <Button asChild className="mt-4"><Link href="/company/offres/nouvelle">Créer une offre</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Alert variant="info">Une offre ayant des candidatures ne peut pas être supprimée ; archivez-la afin de conserver l’historique de recrutement.</Alert>
    </div>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Brouillon",
    published: "Publiée",
    paused: "En pause",
    closed: "Clôturée",
    archived: "Archivée",
  };
  return labels[status] ?? status;
}
