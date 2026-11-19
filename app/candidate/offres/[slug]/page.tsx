import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, MapPin } from "lucide-react";
import { ApplyToJobForm } from "@/components/candidate/apply-to-job-form";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employmentLabel, formatDate, formatSalary, workplaceLabel } from "@/lib/candidate/queries";
import { requireRole } from "@/lib/auth/roles";
import { educationLevelLabel } from "@/lib/jobs/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { supabase } = await requireRole("candidate");
  const { slug } = await params;
  const { data: job } = await supabase.from("jobs").select("title").eq("slug", slug).maybeSingle();
  return { title: job?.title ?? "Détail de l’offre" };
}

export default async function CandidateJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { supabase, user } = await requireRole("candidate");
  const { slug } = await params;
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, company_id, title, summary, description, requirements, benefits, city, country_code, employment_type, workplace_type, salary_min, salary_max, salary_currency, minimum_education_level, status, published_at, closes_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Unable to load job details: ${error.message}`);
  if (!job) notFound();

  const [companyResult, jobSkillsResult, applicationResult, resumeResult, candidateResult] = await Promise.all([
    supabase.from("companies").select("name, slug, logo_path, is_verified").eq("id", job.company_id).maybeSingle(),
    supabase.from("job_skills").select("skill_id").eq("job_id", job.id),
    supabase.from("applications").select("id, status").eq("job_id", job.id).eq("candidate_id", user.id).maybeSingle(),
    supabase
      .from("resumes")
      .select("id")
      .eq("candidate_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("candidates").select("profile_id").eq("profile_id", user.id).maybeSingle(),
  ]);

  if (companyResult.error) throw new Error(`Unable to load company: ${companyResult.error.message}`);
  if (jobSkillsResult.error) throw new Error(`Unable to load job skills: ${jobSkillsResult.error.message}`);
  if (applicationResult.error) throw new Error(`Unable to check application status: ${applicationResult.error.message}`);
  if (resumeResult.error) throw new Error(`Unable to check candidate resume: ${resumeResult.error.message}`);
  if (candidateResult.error) throw new Error(`Unable to check candidate profile: ${candidateResult.error.message}`);
  if (
    (job.status !== "published" || (job.closes_at && new Date(job.closes_at) <= new Date()))
    && !applicationResult.data
  ) {
    notFound();
  }

  const skillIds = (jobSkillsResult.data ?? []).map((item) => item.skill_id);
  const { data: skills, error: skillsError } = skillIds.length
    ? await supabase.from("skills").select("id, name").in("id", skillIds).order("name")
    : { data: [], error: null };
  if (skillsError) throw new Error(`Unable to load skill names: ${skillsError.message}`);

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const educationLevel = educationLevelLabel(job.minimum_education_level);

  return (
    <div className="space-y-6">
      <Button asChild className="-ml-3" variant="ghost">
        <Link href="/candidate/offres"><ArrowLeft className="h-4 w-4" />Retour aux offres</Link>
      </Button>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{employmentLabel(job.employment_type)}</Badge>
              <Badge variant="outline">{workplaceLabel(job.workplace_type)}</Badge>
              {companyResult.data?.is_verified && <Badge variant="success">Entreprise vérifiée</Badge>}
            </div>
            <CardTitle className="pt-3 text-2xl sm:text-3xl">{job.title}</CardTitle>
            <p className="text-muted-foreground">{companyResult.data?.name ?? "Entreprise"}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{job.city || "Togo"}</span>
              <span className="inline-flex items-center gap-1"><BriefcaseBusiness className="h-4 w-4" />Publié le {formatDate(job.published_at)}</span>
              {educationLevel && <span>Niveau d’étude : {educationLevel}</span>}
              {salary && <span className="font-semibold text-foreground">{salary}</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {job.summary && <p className="rounded-lg bg-secondary/60 p-4 text-sm leading-6">{job.summary}</p>}
            <JobSection title="Description du poste" text={job.description} />
            {job.requirements && <JobSection title="Profil recherché" text={job.requirements} />}
            {job.benefits && <JobSection title="Avantages" text={job.benefits} />}
            {skills?.length ? (
              <section>
                <h2 className="font-semibold">Compétences recherchées</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.map((skill) => <Badge key={skill.id} variant="secondary">{skill.name}</Badge>)}
                </div>
              </section>
            ) : null}
          </CardContent>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Postuler à cette offre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {applicationResult.data ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Vous avez déjà postulé à cette offre.</p>
                  <ApplicationStatusBadge status={applicationResult.data.status} />
                  <Button asChild className="w-full" variant="secondary">
                    <Link href="/candidate/candidatures">Voir mes candidatures</Link>
                  </Button>
                </div>
              ) : !candidateResult.data ? (
                <div className="space-y-3">
                  <Alert variant="warning">Complétez votre profil professionnel avant de postuler.</Alert>
                  <Button asChild className="w-full" variant="secondary">
                    <Link href="/candidate/profil">Compléter mon profil</Link>
                  </Button>
                </div>
              ) : resumeResult.data ? (
                <ApplyToJobForm jobId={job.id} />
              ) : (
                <div className="space-y-3">
                  <Alert variant="warning">Ajoutez un CV principal avant de postuler.</Alert>
                  <Button asChild className="w-full" variant="secondary">
                    <Link href="/candidate/cv">Ajouter un CV</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">À propos de l’entreprise</CardTitle></CardHeader>
            <CardContent>
              <p className="font-medium">{companyResult.data?.name ?? "Entreprise"}</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function JobSection({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{text}</div>
    </section>
  );
}
