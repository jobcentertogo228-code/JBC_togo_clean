import type { Metadata } from "next";
import { CandidateProfileForm } from "@/components/candidate/profile-form";
import { CandidateProfileHistory } from "@/components/candidate/profile-history";
import { CandidateSkillsForm } from "@/components/candidate/skills-form";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCandidateAvatarUrl } from "@/lib/candidate/avatar";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Mon profil candidat" };

export default async function CandidateProfilePage() {
  const { supabase, user, profile } = await requireRole("candidate");
  const [candidateResult, profileDetails, skillsResult, selectedSkillsResult, languagesResult, educationResult, experiencesResult, resumesResult] = await Promise.all([
    supabase.from("candidates").select("*").eq("profile_id", user.id).maybeSingle(),
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
    supabase.from("skills").select("id, name, category").order("name").limit(100),
    supabase.from("candidate_skills").select("skill_id, proficiency").eq("candidate_id", user.id),
    supabase.from("candidate_languages").select("id, language, proficiency").eq("candidate_id", user.id).order("language"),
    supabase.from("education").select("id, institution, qualification, field_of_study, start_date, end_date, description").eq("candidate_id", user.id).order("start_date", { ascending: false }),
    supabase.from("experiences").select("id, employer, job_title, start_date, end_date, is_current, description").eq("candidate_id", user.id).order("start_date", { ascending: false }),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("candidate_id", user.id),
  ]);

  const candidate = candidateResult.data;
  const queryFailures = [
    { query: "candidates", error: candidateResult.error },
    { query: "profiles.phone", error: profileDetails.error },
    { query: "skills", error: skillsResult.error },
    { query: "candidate_skills", error: selectedSkillsResult.error },
    { query: "candidate_languages", error: languagesResult.error },
    { query: "education", error: educationResult.error },
    { query: "experiences", error: experiencesResult.error },
    { query: "resumes count", error: resumesResult.error },
  ].filter((failure) => failure.error);

  for (const { query, error } of queryFailures) {
    console.error("[candidate/profile] Supabase query failed", {
      userId: user.id,
      role: profile.account_role,
      query,
      error: {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      },
    });
  }

  const nameParts = profile.full_name.trim().split(/\s+/).filter(Boolean);
  const firstName = candidate?.first_name ?? nameParts[0] ?? "";
  const lastName = candidate?.last_name ?? nameParts.slice(1).join(" ");
  const photoUrl = await getCandidateAvatarUrl(supabase, user.id, candidate?.photo_url ?? null);
  const selectedSkills = selectedSkillsResult.data ?? [];
  const languages = languagesResult.data ?? [];
  const education = educationResult.data ?? [];
  const experiences = experiencesResult.data ?? [];
  const completionFields = [
    Boolean(firstName && lastName),
    Boolean(profileDetails.data?.phone),
    Boolean(candidate?.photo_url),
    Boolean(candidate?.headline),
    Boolean(candidate?.summary),
    Boolean(candidate?.city && candidate.address),
    candidate?.years_experience !== null && candidate?.years_experience !== undefined,
    selectedSkills.length > 0,
    languages.length > 0,
    education.length > 0,
    experiences.length > 0,
    (resumesResult.count ?? 0) > 0,
  ];
  const completionPercent = Math.round(completionFields.filter(Boolean).length / completionFields.length * 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Mon espace candidat</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Mon profil</h1>
        <p className="mt-2 text-muted-foreground">Présentez clairement votre parcours et vos compétences aux recruteurs.</p>
      </div>
      {queryFailures.length > 0 && (
        <Alert variant="warning">
          Certaines données du profil sont temporairement indisponibles. Les informations chargées restent consultables et modifiables.
        </Alert>
      )}
      {!candidate && (
        <Alert variant="info">
          Votre profil professionnel sera créé lors de l’enregistrement de vos informations.
        </Alert>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Complétion du profil</CardTitle>
            <span className="text-sm font-semibold tabular-nums text-primary">{completionPercent}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercent} />
          <p className="mt-2 text-sm text-muted-foreground">
            Ajoutez vos compétences, expériences et CV pour améliorer votre visibilité auprès des recruteurs.
          </p>
        </CardContent>
      </Card>
      <CandidateProfileForm
        initial={{
          candidateCode: candidate?.candidate_code ?? "Attribué à l’enregistrement",
          candidateId: user.id,
          photoUrl,
          firstName,
          lastName,
          phone: profileDetails.data?.phone ?? "",
          displayName: candidate?.display_name ?? profile.full_name,
          headline: candidate?.headline ?? "",
          summary: candidate?.summary ?? "",
          address: candidate?.address ?? "",
          city: candidate?.city ?? "",
          countryCode: candidate?.country_code.trim() ?? "TG",
          birthDate: candidate?.birth_date ?? "",
          nationality: candidate?.nationality ?? "",
          currentStatus: candidate?.current_status ?? "",
          availability: candidate?.availability ?? "",
          yearsExperience: candidate?.years_experience?.toString() ?? "",
          desiredSalaryMin: candidate?.desired_salary_min?.toString() ?? "",
          desiredSalaryMax: candidate?.desired_salary_max?.toString() ?? "",
        }}
      />
      <CandidateSkillsForm
        selectedSkills={selectedSkills}
        skills={skillsResult.data ?? []}
      />
      <CandidateProfileHistory
        education={education}
        experiences={experiences}
        languages={languages}
      />
    </div>
  );
}
