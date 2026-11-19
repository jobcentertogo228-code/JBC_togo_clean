import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, MapPin } from "lucide-react";
import { ApplyToJobForm } from "@/components/candidate/apply-to-job-form";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { SavedJobButton } from "@/components/jobs/saved-job-button";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileForUser, roleHome } from "@/lib/auth/roles";
import { isAuthSessionMissingError } from "@/lib/auth/session";
import {
  employmentLabel,
  educationLevelLabel,
  experienceLabel,
  formatJobDate,
  formatJobSalary,
} from "@/lib/jobs/queries";
import { formatDate, workplaceLabel } from "@/lib/candidate/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: job, error } = await supabase.from("jobs").select("title, summary").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Impossible de charger l’offre : ${error.message}`);
  return {
    title: job?.title ?? "Détail de l’offre",
    description: job?.summary ?? "Consultez cette offre d’emploi sur JOB-CENTER.",
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && !isAuthSessionMissingError(authError)) {
    throw new Error(`Impossible de vérifier la session : ${authError.message}`);
  }

  const user = authData.user;
  const profile = user ? await getProfileForUser(supabase, user) : null;
  if (user && !profile) throw new Error("Le profil du compte connecté est introuvable.");

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, company_id, title, slug, summary, domain, description, requirements, benefits, city, country_code, employment_type, workplace_type, salary_min, salary_max, salary_currency, experience_level, experience_min_years, minimum_education_level, status, published_at, closes_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Impossible de charger l’offre : ${error.message}`);
  if (!job) notFound();

  const isCandidate = profile?.account_role === "candidate";
  const candidateId = isCandidate ? user?.id ?? null : null;
  const [companyResult, jobSkillsResult, applicationResult, resumeResult, candidateResult, savedResult] = await Promise.all([
    supabase.from("companies").select("name, slug, logo_path, is_verified").eq("id", job.company_id).maybeSingle(),
    supabase.from("job_skills").select("skill_id").eq("job_id", job.id),
    candidateId
      ? supabase.from("applications").select("id, status").eq("job_id", job.id).eq("candidate_id", candidateId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    candidateId
      ? supabase
        .from("resumes")
        .select("id")
        .eq("candidate_id", candidateId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    candidateId
      ? supabase.from("candidates").select("profile_id").eq("profile_id", candidateId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    candidateId
      ? supabase.from("saved_jobs").select("job_id").eq("candidate_id", candidateId).eq("job_id", job.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (companyResult.error) throw new Error(`Impossible de charger l’entreprise : ${companyResult.error.message}`);
  if (jobSkillsResult.error) throw new Error(`Impossible de charger les compétences : ${jobSkillsResult.error.message}`);
  if (applicationResult.error) throw new Error(`Impossible de vérifier la candidature : ${applicationResult.error.message}`);
  if (resumeResult.error) throw new Error(`Impossible de charger votre CV principal : ${resumeResult.error.message}`);
  if (candidateResult.error) throw new Error(`Impossible de vérifier le profil candidat : ${candidateResult.error.message}`);
  if (savedResult.error) throw new Error(`Impossible de vérifier l’offre sauvegardée : ${savedResult.error.message}`);

  const isStillOpen = job.status === "published" && (!job.closes_at || new Date(job.closes_at) > new Date());
  if (!isStillOpen && !applicationResult.data) notFound();

  const skillIds = (jobSkillsResult.data ?? []).map((item) => item.skill_id);
  const { data: skills, error: skillsError } = skillIds.length
    ? await supabase.from("skills").select("id, name").in("id", skillIds).order("name")
    : { data: [], error: null };
  if (skillsError) throw new Error(`Impossible de charger les compétences : ${skillsError.message}`);

  const salary = formatJobSalary(job.salary_min, job.salary_max, job.salary_currency);
  const experience = experienceLabel(job.experience_level, job.experience_min_years);
  const educationLevel = educationLevelLabel(job.minimum_education_level);
  const companyName = companyResult.data?.name ?? "Entreprise";
  const companyLogo = companyResult.data?.logo_path?.startsWith("https://")
    ? companyResult.data.logo_path
    : null;
  const accountHref = profile ? roleHome(profile.account_role) : null;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-bold tracking-tight text-slate-950" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground">J</span>
            JOB-CENTER
          </Link>
          <nav aria-label="Navigation principale" className="flex items-center gap-4 text-sm">
            <Link className="font-semibold text-primary" href="/emplois">Offres d’emploi</Link>
            {accountHref ? (
              <Button asChild size="sm" variant="outline"><Link href={accountHref}>Mon espace</Link></Button>
            ) : (
              <Button asChild size="sm" variant="outline"><Link href="/connexion">Connexion</Link></Button>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild className="-ml-3 mb-5" variant="ghost">
          <Link href="/emplois"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Retour aux offres</Link>
        </Button>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 rounded-xl" imageUrl={companyLogo} name={companyName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{employmentLabel(job.employment_type)}</Badge>
                      <Badge variant="outline">{workplaceLabel(job.workplace_type)}</Badge>
                      {companyResult.data?.is_verified && <Badge variant="success">Entreprise vérifiée</Badge>}
                    </div>
                    <CardTitle className="pt-3 text-2xl sm:text-3xl">{job.title}</CardTitle>
                    <p className="mt-2 text-muted-foreground">{companyName}</p>
                  </div>
                  {(isCandidate || !user) && (
                    <SavedJobButton
                      initialSaved={Boolean(savedResult.data)}
                      jobId={job.id}
                      slug={job.slug}
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="h-4 w-4" />{job.city || "Togo"}</span>
                  <span className="inline-flex items-center gap-1"><BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />Publié le {formatDate(job.published_at)}</span>
                  {experience && <span>{experience}</span>}
                  {educationLevel && <span>Niveau d’étude : {educationLevel}</span>}
                  {salary && <span className="font-semibold text-foreground">{salary}</span>}
                </div>
                {job.domain && <Badge className="mt-2" variant="info">{job.domain}</Badge>}
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
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  Publiée le {formatJobDate(job.published_at)}
                  {job.closes_at ? ` · Date limite : ${formatDate(job.closes_at)}` : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <Card>
              <CardHeader><CardTitle className="text-lg">Postuler à cette offre</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {applicationResult.data ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Vous avez déjà postulé à cette offre.</p>
                    <ApplicationStatusBadge status={applicationResult.data.status} />
                    <Button asChild className="w-full" variant="secondary">
                      <Link href="/candidate/candidatures">Voir mes candidatures</Link>
                    </Button>
                  </div>
                ) : !isStillOpen ? (
                  <Alert variant="warning">Cette offre n’accepte plus de candidatures.</Alert>
                ) : !user ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Connectez-vous ou créez un compte candidat pour postuler.</p>
                    <Button asChild className="w-full">
                      <Link href={`/connexion?next=${encodeURIComponent(`/emplois/${job.slug}`)}`}>Se connecter pour postuler</Link>
                    </Button>
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/inscription/candidat?next=${encodeURIComponent(`/emplois/${job.slug}`)}`}>Créer un compte candidat</Link>
                    </Button>
                  </div>
                ) : !isCandidate ? (
                  <Alert variant="info">La candidature est réservée aux comptes candidat.</Alert>
                ) : !candidateResult.data ? (
                  <div className="space-y-3">
                    <Alert variant="warning">Complétez votre profil professionnel avant de postuler.</Alert>
                    <Button asChild className="w-full" variant="secondary"><Link href="/candidate/profil">Compléter mon profil</Link></Button>
                  </div>
                ) : resumeResult.data ? (
                  <ApplyToJobForm jobId={job.id} />
                ) : (
                  <div className="space-y-3">
                    <Alert variant="warning">Ajoutez un CV principal avant de postuler.</Alert>
                    <Button asChild className="w-full" variant="secondary"><Link href="/candidate/cv">Ajouter un CV</Link></Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">À propos de l’entreprise</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-lg" imageUrl={companyLogo} name={companyName} />
                  <div>
                    <p className="font-medium">{companyName}</p>
                    {companyResult.data?.is_verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />Entreprise vérifiée
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function JobSection({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{text}</div>
    </section>
  );
}
