import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Download, FileText, GraduationCap, Languages, MapPin, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/candidate/queries";
import { requireRole } from "@/lib/auth/roles";
import { getCandidateAvatarUrl } from "@/lib/candidate/avatar";

export const metadata: Metadata = { title: "Profil candidat" };

export default async function CompanyCandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireRole("company");
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("profile_id, candidate_code, display_name, first_name, last_name, photo_url, headline, summary, city, country_code, years_experience, current_status, availability, visibility")
    .eq("profile_id", id)
    .maybeSingle();

  if (candidateError) throw new Error(`Impossible de charger le profil candidat : ${candidateError.message}`);
  if (!candidate) notFound();

  const [skillsResult, languagesResult, educationResult, experienceResult, resumesResult] = await Promise.all([
    supabase.from("candidate_skills").select("skill_id, proficiency").eq("candidate_id", id),
    supabase.from("candidate_languages").select("id, language, proficiency").eq("candidate_id", id).order("language"),
    supabase.from("education").select("id, institution, qualification, field_of_study, start_date, end_date, description").eq("candidate_id", id).order("start_date", { ascending: false }),
    supabase.from("experiences").select("id, employer, job_title, start_date, end_date, is_current, description").eq("candidate_id", id).order("start_date", { ascending: false }),
    supabase.from("resumes").select("id, title, storage_path, mime_type, size_bytes, created_at").eq("candidate_id", id).order("is_default", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  if (skillsResult.error) throw new Error(`Impossible de charger les compétences : ${skillsResult.error.message}`);
  if (languagesResult.error) throw new Error(`Impossible de charger les langues : ${languagesResult.error.message}`);
  if (educationResult.error) throw new Error(`Impossible de charger les formations : ${educationResult.error.message}`);
  if (experienceResult.error) throw new Error(`Impossible de charger les expériences : ${experienceResult.error.message}`);
  if (resumesResult.error) throw new Error(`Impossible de charger les CV partagés : ${resumesResult.error.message}`);

  const selectedSkills = skillsResult.data ?? [];
  const skillIds = [...new Set(selectedSkills.map((item) => item.skill_id))];
  const [{ data: skills, error: skillNamesError }, resumes] = await Promise.all([
    skillIds.length
      ? supabase.from("skills").select("id, name").in("id", skillIds).order("name")
      : Promise.resolve({ data: [], error: null }),
    Promise.all((resumesResult.data ?? []).map(async (resume) => {
      const { data, error } = await supabase.storage
        .from("candidate-resumes")
        .createSignedUrl(resume.storage_path, 300);
      if (error) throw new Error(`Impossible de créer le lien sécurisé du CV : ${error.message}`);
      return { ...resume, signedUrl: data.signedUrl };
    })),
  ]);
  if (skillNamesError) throw new Error(`Impossible de charger les noms de compétences : ${skillNamesError.message}`);

  const name = candidate.display_name
    || [candidate.first_name, candidate.last_name].filter(Boolean).join(" ")
    || "Candidat";
  const photoUrl = await getCandidateAvatarUrl(supabase, id, candidate.photo_url);
  const skillProficiencyById = new Map(selectedSkills.map((item) => [item.skill_id, item.proficiency]));
  const visibilityLabel = candidate.visibility === "public" ? "Profil public" : "Visible aux entreprises";

  return (
    <div className="space-y-6">
      <Button asChild className="-ml-3" variant="ghost"><Link href="/company/candidats"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Retour aux candidats</Link></Button>
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 shrink-0" imageUrl={photoUrl} name={name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
              <Badge variant="outline">{visibilityLabel}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{candidate.candidate_code}</p>
            {candidate.headline && <p className="mt-3 text-lg font-semibold text-primary">{candidate.headline}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {candidate.city && <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="h-4 w-4" />{candidate.city}, {candidate.country_code.trim()}</span>}
              {candidate.years_experience !== null && <span>{candidate.years_experience} an{candidate.years_experience > 1 ? "s" : ""} d’expérience</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {candidate.current_status && statusLabel(candidate.current_status)}
              {candidate.availability ? ` · Disponibilité : ${availabilityLabel(candidate.availability)}` : ""}
            </p>
          </div>
          <UserRound aria-hidden="true" className="hidden h-6 w-6 text-muted-foreground sm:block" />
        </CardContent>
      </Card>

      {candidate.summary && (
        <Card>
          <CardHeader><CardTitle>Présentation</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{candidate.summary}</p></CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compétences</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills?.length ? skills.map((skill) => {
              const proficiency = skillProficiencyById.get(skill.id);
              return <Badge key={skill.id} variant="secondary">{skill.name}{proficiency ? ` · ${proficiencyLabel(proficiency)}` : ""}</Badge>;
            }) : <p className="text-sm text-muted-foreground">Aucune compétence renseignée.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Languages aria-hidden="true" className="mr-2 inline h-4 w-4" />Langues</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {languagesResult.data?.length ? languagesResult.data.map((language) => (
              <div className="flex justify-between gap-3 text-sm" key={language.id}>
                <span className="font-medium">{language.language}</span><span className="text-muted-foreground">{languageLabel(language.proficiency)}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">Aucune langue renseignée.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><GraduationCap aria-hidden="true" className="mr-2 inline h-5 w-5" />Formations</CardTitle>
          <CardDescription>Parcours de formation partagé par le candidat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {educationResult.data?.length ? educationResult.data.map((item) => (
            <article className="border-l-2 border-primary/20 pl-4" key={item.id}>
              <p className="font-semibold">{item.qualification || item.institution}</p>
              <p className="text-sm text-muted-foreground">{item.institution}{item.field_of_study ? ` · ${item.field_of_study}` : ""}</p>
              {(item.start_date || item.end_date) && <p className="mt-1 text-xs text-muted-foreground">{year(item.start_date)} – {year(item.end_date)}</p>}
              {item.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>}
            </article>
          )) : <p className="text-sm text-muted-foreground">Aucune formation renseignée.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><BriefcaseBusiness aria-hidden="true" className="mr-2 inline h-5 w-5" />Expériences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {experienceResult.data?.length ? experienceResult.data.map((item) => (
            <article className="border-l-2 border-primary/20 pl-4" key={item.id}>
              <p className="font-semibold">{item.job_title}</p>
              <p className="text-sm text-muted-foreground">{item.employer}{item.is_current ? " · Poste actuel" : ""}</p>
              {(item.start_date || item.end_date) && <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.start_date)} – {item.is_current ? "Aujourd’hui" : formatDate(item.end_date)}</p>}
              {item.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>}
            </article>
          )) : <p className="text-sm text-muted-foreground">Aucune expérience renseignée.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><FileText aria-hidden="true" className="mr-2 inline h-5 w-5" />CV partagés</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {resumes.length ? resumes.map((resume) => (
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center" key={resume.id}>
              <div>
                <p className="font-medium">{resume.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{(resume.size_bytes / 1024 / 1024).toFixed(1)} Mo · Ajouté le {formatDate(resume.created_at)}</p>
              </div>
              <Button asChild size="sm" variant="outline"><a href={resume.signedUrl} rel="noreferrer" target="_blank"><Download aria-hidden="true" className="h-4 w-4" />Consulter le CV</a></Button>
            </div>
          )) : <p className="text-sm text-muted-foreground">Le candidat n’a pas partagé de CV accessible aux recruteurs.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function year(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).getFullYear() : "…";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    employed: "En poste",
    unemployed: "En recherche d’emploi",
    student: "Étudiant(e)",
    freelance: "Indépendant(e)",
    other: "Autre situation",
  };
  return labels[status] ?? status;
}

function availabilityLabel(availability: string) {
  const labels: Record<string, string> = {
    immediate: "Immédiate",
    two_weeks: "Sous deux semaines",
    one_month: "Sous un mois",
    three_months: "Sous trois mois",
    negotiable: "À convenir",
  };
  return labels[availability] ?? availability;
}

function languageLabel(level: string) {
  const labels: Record<string, string> = {
    basic: "Notions",
    conversational: "Conversationnel",
    professional: "Professionnel",
    native: "Langue maternelle",
  };
  return labels[level] ?? level;
}

function proficiencyLabel(level: number) {
  const labels = ["", "Débutant", "Élémentaire", "Intermédiaire", "Avancé", "Expert"];
  return labels[level] ?? "Niveau renseigné";
}
