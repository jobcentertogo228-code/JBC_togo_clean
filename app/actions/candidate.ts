"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getProfileForUser, requireRole, roleHome } from "@/lib/auth/roles";
import { isAuthSessionMissingError } from "@/lib/auth/session";
import { createSupabaseActionClient } from "@/lib/supabase/server";

export type CandidateActionState = {
  error?: string;
  message?: string;
};

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Saisissez votre prénom.").max(80),
  lastName: z.string().trim().min(1, "Saisissez votre nom.").max(80),
  phone: z.string().trim().max(40).optional(),
  displayName: z.string().trim().max(120).optional(),
  headline: z.string().trim().max(160).optional(),
  summary: z.string().trim().max(10000).optional(),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(120).optional(),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).optional(),
  birthDate: z.string().optional(),
  nationality: z.string().trim().max(80).optional(),
  currentStatus: z.union([
    z.literal(""),
    z.enum(["employed", "unemployed", "student", "freelance", "other"]),
  ]).optional(),
  availability: z.union([
    z.literal(""),
    z.enum(["immediate", "two_weeks", "one_month", "three_months", "negotiable"]),
  ]).optional(),
  yearsExperience: z.string().optional(),
  desiredSalaryMin: z.string().optional(),
  desiredSalaryMax: z.string().optional(),
}).refine(
  (value) => !value.birthDate || (
    /^\d{4}-\d{2}-\d{2}$/.test(value.birthDate)
    && !Number.isNaN(Date.parse(`${value.birthDate}T00:00:00.000Z`))
    && new Date(`${value.birthDate}T00:00:00.000Z`) <= new Date()
  ),
  { path: ["birthDate"], message: "Saisissez une date de naissance valide." },
).refine(
  (value) => {
    const min = value.desiredSalaryMin?.trim() ? Number(value.desiredSalaryMin) : null;
    const max = value.desiredSalaryMax?.trim() ? Number(value.desiredSalaryMax) : null;
    return (min === null || (Number.isFinite(min) && min >= 0 && min <= 9_999_999_999))
      && (max === null || (Number.isFinite(max) && max >= 0 && max <= 9_999_999_999))
      && (min === null || max === null || min <= max);
  },
  { path: ["desiredSalaryMax"], message: "Vérifiez les montants de salaire souhaités." },
);

const visibilitySchema = z.object({
  visibility: z.enum(["private", "companies_only", "public"]),
});

const skillsSchema = z.object({
  skillIds: z.array(z.string().uuid()).max(30, "Vous pouvez sélectionner au maximum 30 compétences."),
  skillProficiencies: z.array(z.string().regex(/^[0-9a-f-]{36}:[1-5]$/i)).max(30),
});

const passwordSchema = z.object({
  password: z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères."),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Les mots de passe ne correspondent pas.",
});

const languageSchema = z.object({
  languageId: z.string().uuid().optional().or(z.literal("")),
  language: z.string().trim().min(2).max(80),
  proficiency: z.enum(["basic", "conversational", "professional", "native"]),
});

const educationSchema = z.object({
  educationId: z.string().uuid().optional().or(z.literal("")),
  institution: z.string().trim().min(1).max(180),
  qualification: z.string().trim().max(180).optional(),
  fieldOfStudy: z.string().trim().max(180).optional(),
  startYear: z.string().optional(),
  endYear: z.string().optional(),
  description: z.string().trim().max(5000).optional(),
}).refine(
  (value) => {
    const start = value.startYear?.trim() ? Number(value.startYear) : null;
    const end = value.endYear?.trim() ? Number(value.endYear) : null;
    const currentYear = new Date().getFullYear();
    return [start, end].every((year) => year === null || (Number.isInteger(year) && year >= 1950 && year <= currentYear + 5))
      && (start === null || end === null || end >= start);
  },
  { path: ["endYear"], message: "Vérifiez les années de formation." },
);

const experienceSchema = z.object({
  experienceId: z.string().uuid().optional().or(z.literal("")),
  employer: z.string().trim().min(1).max(180),
  jobTitle: z.string().trim().min(1).max(180),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.string().optional(),
  description: z.string().trim().max(8000).optional(),
}).refine(
  (value) => {
    const start = value.startDate?.trim() || null;
    const end = value.isCurrent === "on" ? null : value.endDate?.trim() || null;
    return (!start || /^\d{4}-\d{2}-\d{2}$/.test(start))
      && (!end || /^\d{4}-\d{2}-\d{2}$/.test(end))
      && (!start || !end || end >= start);
  },
  { path: ["endDate"], message: "Vérifiez les dates de cette expérience." },
);

function formValues(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

function firstIssue(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Vérifiez les informations saisies.";
}

export async function saveCandidateProfileAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const parsed = profileSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase, user } = await requireRole("candidate");
  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
  const yearsExperience = parsed.data.yearsExperience?.trim()
    ? Number(parsed.data.yearsExperience)
    : null;
  const desiredSalaryMin = parsed.data.desiredSalaryMin?.trim()
    ? Number(parsed.data.desiredSalaryMin)
    : null;
  const desiredSalaryMax = parsed.data.desiredSalaryMax?.trim()
    ? Number(parsed.data.desiredSalaryMax)
    : null;

  if (yearsExperience !== null && (!Number.isFinite(yearsExperience) || yearsExperience < 0 || yearsExperience > 80)) {
    return { error: "L’expérience doit être comprise entre 0 et 80 ans." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName.slice(0, 120),
      phone: parsed.data.phone?.trim() || null,
    })
    .eq("id", user.id);

  if (profileError) return { error: "Impossible de mettre à jour vos informations personnelles." };

  const { error: candidateError } = await supabase
    .from("candidates")
    .upsert(
      {
        profile_id: user.id,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        display_name: parsed.data.displayName?.trim() || fullName,
        headline: parsed.data.headline?.trim() || null,
        summary: parsed.data.summary?.trim() || null,
        address: parsed.data.address?.trim() || null,
        city: parsed.data.city?.trim() || null,
        country_code: parsed.data.countryCode || "TG",
        birth_date: parsed.data.birthDate?.trim() || null,
        nationality: parsed.data.nationality?.trim() || null,
        current_status: parsed.data.currentStatus || null,
        availability: parsed.data.availability || null,
        years_experience: yearsExperience,
        desired_salary_min: desiredSalaryMin,
        desired_salary_max: desiredSalaryMax,
      },
      { onConflict: "profile_id" },
    );

  if (candidateError) return { error: "Les informations du profil n’ont pas pu être enregistrées." };

  revalidatePath("/candidate");
  revalidatePath("/candidate/profil");
  revalidatePath("/company/candidats");
  return { message: "Votre profil a été mis à jour." };
}

export async function saveCandidateLanguageAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const parsed = languageSchema.safeParse({
    languageId: formData.get("languageId") ?? "",
    language: formData.get("language"),
    proficiency: formData.get("proficiency"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase, user } = await requireRole("candidate");
  const values = { language: parsed.data.language, proficiency: parsed.data.proficiency };
  const query = parsed.data.languageId
    ? supabase.from("candidate_languages").update(values).eq("id", parsed.data.languageId).eq("candidate_id", user.id)
    : supabase.from("candidate_languages").insert({ ...values, candidate_id: user.id });
  const { error } = await query;
  if (error) {
    console.error("Unable to save candidate language:", error);
    return { error: error.code === "23505" ? "Cette langue figure déjà dans votre profil." : "La langue n’a pas pu être enregistrée." };
  }

  revalidatePath("/candidate/profil");
  return { message: "La langue a été enregistrée." };
}

export async function deleteCandidateLanguageAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const languageId = z.string().uuid().safeParse(formData.get("languageId"));
  if (!languageId.success) return { error: "Cette langue est invalide." };

  const { supabase, user } = await requireRole("candidate");
  const { error } = await supabase
    .from("candidate_languages")
    .delete()
    .eq("id", languageId.data)
    .eq("candidate_id", user.id);
  if (error) {
    console.error("Unable to delete candidate language:", error);
    return { error: "La langue n’a pas pu être supprimée." };
  }

  revalidatePath("/candidate/profil");
  return { message: "La langue a été supprimée." };
}

export async function saveCandidateEducationAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const parsed = educationSchema.safeParse({
    educationId: formData.get("educationId") ?? "",
    institution: formData.get("institution"),
    qualification: formData.get("qualification") ?? "",
    fieldOfStudy: formData.get("fieldOfStudy") ?? "",
    startYear: formData.get("startYear") ?? "",
    endYear: formData.get("endYear") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase, user } = await requireRole("candidate");
  const startYear = parsed.data.startYear?.trim();
  const endYear = parsed.data.endYear?.trim();
  const values = {
    institution: parsed.data.institution,
    qualification: parsed.data.qualification?.trim() || null,
    field_of_study: parsed.data.fieldOfStudy?.trim() || null,
    start_date: startYear ? `${startYear}-01-01` : null,
    end_date: endYear ? `${endYear}-12-31` : null,
    description: parsed.data.description?.trim() || null,
  };
  const query = parsed.data.educationId
    ? supabase.from("education").update(values).eq("id", parsed.data.educationId).eq("candidate_id", user.id)
    : supabase.from("education").insert({ ...values, candidate_id: user.id });
  const { error } = await query;
  if (error) {
    console.error("Unable to save candidate education:", error);
    return { error: "La formation n’a pas pu être enregistrée." };
  }

  revalidatePath("/candidate/profil");
  return { message: "La formation a été enregistrée." };
}

export async function deleteCandidateEducationAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const educationId = z.string().uuid().safeParse(formData.get("educationId"));
  if (!educationId.success) return { error: "Cette formation est invalide." };

  const { supabase, user } = await requireRole("candidate");
  const { error } = await supabase.from("education").delete().eq("id", educationId.data).eq("candidate_id", user.id);
  if (error) {
    console.error("Unable to delete candidate education:", error);
    return { error: "La formation n’a pas pu être supprimée." };
  }

  revalidatePath("/candidate/profil");
  return { message: "La formation a été supprimée." };
}

export async function saveCandidateExperienceAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const parsed = experienceSchema.safeParse({
    experienceId: formData.get("experienceId") ?? "",
    employer: formData.get("employer"),
    jobTitle: formData.get("jobTitle"),
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    isCurrent: formData.get("isCurrent") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase, user } = await requireRole("candidate");
  const isCurrent = parsed.data.isCurrent === "on";
  const values = {
    employer: parsed.data.employer,
    job_title: parsed.data.jobTitle,
    start_date: parsed.data.startDate?.trim() || null,
    end_date: isCurrent ? null : parsed.data.endDate?.trim() || null,
    is_current: isCurrent,
    description: parsed.data.description?.trim() || null,
  };
  const query = parsed.data.experienceId
    ? supabase.from("experiences").update(values).eq("id", parsed.data.experienceId).eq("candidate_id", user.id)
    : supabase.from("experiences").insert({ ...values, candidate_id: user.id });
  const { error } = await query;
  if (error) {
    console.error("Unable to save candidate experience:", error);
    return { error: "L’expérience n’a pas pu être enregistrée." };
  }

  revalidatePath("/candidate/profil");
  return { message: "L’expérience a été enregistrée." };
}

export async function deleteCandidateExperienceAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const experienceId = z.string().uuid().safeParse(formData.get("experienceId"));
  if (!experienceId.success) return { error: "Cette expérience est invalide." };

  const { supabase, user } = await requireRole("candidate");
  const { error } = await supabase.from("experiences").delete().eq("id", experienceId.data).eq("candidate_id", user.id);
  if (error) {
    console.error("Unable to delete candidate experience:", error);
    return { error: "L’expérience n’a pas pu être supprimée." };
  }

  revalidatePath("/candidate/profil");
  return { message: "L’expérience a été supprimée." };
}

export async function saveCandidateVisibilityAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const parsed = visibilitySchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase, user } = await requireRole("candidate");
  const { error } = await supabase
    .from("candidates")
    .upsert(
      { profile_id: user.id, visibility: parsed.data.visibility },
      { onConflict: "profile_id" },
    );

  if (error) return { error: "Le réglage de visibilité n’a pas pu être enregistré." };

  revalidatePath("/candidate");
  revalidatePath("/candidate/parametres");
  return { message: "Vos préférences de confidentialité ont été mises à jour." };
}

export async function saveCandidateSkillsAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const parsed = skillsSchema.safeParse({
    skillIds: formData.getAll("skillIds").map(String),
    skillProficiencies: formData.getAll("skillProficiencies").map(String),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const proficiencyBySkill = new Map(
    parsed.data.skillProficiencies.map((entry) => {
      const separator = entry.lastIndexOf(":");
      return [entry.slice(0, separator), Number(entry.slice(separator + 1))] as const;
    }),
  );
  if (
    new Set(parsed.data.skillIds).size !== parsed.data.skillIds.length
    || parsed.data.skillIds.some((skillId) => !proficiencyBySkill.has(skillId))
  ) {
    return { error: "Sélectionnez un niveau pour chaque compétence choisie." };
  }
  const proficiencyValues: Record<string, number> = {};
  for (const skillId of parsed.data.skillIds) {
    const proficiency = proficiencyBySkill.get(skillId);
    if (proficiency === undefined) return { error: "Sélectionnez un niveau pour chaque compétence choisie." };
    proficiencyValues[skillId] = proficiency;
  }

  const { supabase } = await requireRole("candidate");
  const { error } = await supabase.rpc("replace_candidate_skills_with_proficiency", {
    p_skill_ids: parsed.data.skillIds,
    p_proficiency_by_skill: proficiencyValues,
  });

  if (error) {
    console.error("Unable to save candidate skills:", error);
    return { error: "Les compétences n’ont pas pu être enregistrées." };
  }
  revalidatePath("/candidate");
  revalidatePath("/candidate/profil");
  return { message: "Vos compétences ont été mises à jour." };
}

export async function changeCandidatePasswordAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const parsed = passwordSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase } = await requireRole("candidate");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { error: "Le mot de passe n’a pas pu être modifié. Réessayez." };
  return { message: "Votre mot de passe a été modifié." };
}

export async function deleteResumeAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const resumeId = z.string().uuid().safeParse(formData.get("resumeId"));
  if (!resumeId.success) return { error: "Le CV sélectionné est invalide." };

  const { supabase, user } = await requireRole("candidate");
  const { data: resume, error: readError } = await supabase
    .from("resumes")
    .select("id, storage_path")
    .eq("id", resumeId.data)
    .eq("candidate_id", user.id)
    .maybeSingle();

  if (readError) return { error: "Impossible de charger ce CV." };
  if (!resume) return { error: "Ce CV n’existe plus dans votre profil." };

  const { error: deleteError } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resume.id)
    .eq("candidate_id", user.id);

  if (deleteError) {
    return { error: "Ce CV ne peut pas être supprimé, probablement parce qu’il est lié à une candidature." };
  }

  const { error: storageError } = await supabase.storage
    .from("candidate-resumes")
    .remove([resume.storage_path]);

  revalidatePath("/candidate/cv");
  revalidatePath("/candidate");

  if (storageError) {
    return { error: "Le CV a été retiré du profil, mais son fichier n’a pas pu être supprimé du stockage." };
  }

  return { message: "Le CV a été supprimé." };
}

export async function setDefaultResumeAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const resumeId = z.string().uuid().safeParse(formData.get("resumeId"));
  if (!resumeId.success) return { error: "Le CV sélectionné est invalide." };

  const { supabase } = await requireRole("candidate");
  const { error } = await supabase.rpc("set_candidate_default_resume", {
    p_resume_id: resumeId.data,
  });

  if (error) return { error: "Impossible de définir ce document comme CV principal." };
  revalidatePath("/candidate/cv");
  revalidatePath("/candidate");
  return { message: "CV principal mis à jour." };
}

export async function markNotificationReadAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const notificationId = z.string().uuid().safeParse(formData.get("notificationId"));
  if (!notificationId.success) return { error: "Cette notification est invalide." };

  const { supabase, user } = await requireRole("candidate");
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId.data)
    .eq("recipient_id", user.id);

  if (error) return { error: "Impossible de marquer la notification comme lue." };
  revalidatePath("/candidate/notifications");
  revalidatePath("/candidate");
  return { message: "Notification marquée comme lue." };
}

export async function applyToJobAction(
  _previousState: CandidateActionState,
  formData: FormData,
): Promise<CandidateActionState> {
  const jobId = z.string().uuid().safeParse(formData.get("jobId"));
  if (!jobId.success) return { error: "Cette offre est invalide." };

  const { supabase, user } = await requireRole("candidate");
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (candidateError) return { error: "Impossible de vérifier votre profil candidat." };
  if (!candidate) return { error: "Complétez d’abord votre profil avant de postuler." };

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, status, closes_at")
    .eq("id", jobId.data)
    .maybeSingle();

  if (jobError) return { error: "Impossible de vérifier cette offre." };
  if (!job || job.status !== "published" || (job.closes_at && new Date(job.closes_at) <= new Date())) {
    return { error: "Cette offre n’accepte plus de candidatures." };
  }

  const { data: existingApplication, error: existingError } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId.data)
    .eq("candidate_id", user.id)
    .maybeSingle();

  if (existingError) return { error: "Impossible de vérifier vos candidatures existantes." };
  if (existingApplication) return { error: "Vous avez déjà postulé à cette offre." };

  const { data: defaultResume, error: resumeError } = await supabase
    .from("resumes")
    .select("id")
    .eq("candidate_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resumeError) return { error: "Impossible de charger votre CV principal." };
  if (!defaultResume) return { error: "Ajoutez un CV à votre profil avant de postuler." };

  const { error: applicationError } = await supabase.from("applications").insert({
    job_id: jobId.data,
    candidate_id: user.id,
    resume_id: defaultResume.id,
  });

  if (applicationError?.code === "23505") {
    return { error: "Vous avez déjà postulé à cette offre." };
  }
  if (applicationError) {
    console.error("Unable to submit job application:", applicationError);
    return { error: "Votre candidature n’a pas pu être envoyée. Réessayez." };
  }

  revalidatePath("/candidate");
  revalidatePath("/candidate/candidatures");
  revalidatePath("/company");
  revalidatePath("/company/candidatures");
  redirect("/candidate/candidatures");
}

export type SavedJobActionState = {
  isSaved: boolean;
  error?: string;
};

export async function toggleSavedJobAction(
  _previousState: SavedJobActionState,
  formData: FormData,
): Promise<SavedJobActionState> {
  const jobId = z.string().uuid().safeParse(formData.get("jobId"));
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().safeParse(formData.get("slug") || undefined);
  if (!jobId.success || !slug.success) {
    return { isSaved: false, error: "Cette offre n’est pas valide." };
  }

  const supabase = await createSupabaseActionClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError && !isAuthSessionMissingError(authError)) {
    throw new Error(`Impossible de vérifier la session : ${authError.message}`);
  }
  if (!authData.user) {
    const next = slug.data ? `/emplois/${slug.data}` : "/candidate/offres/sauvegardees";
    redirect(`/connexion?next=${encodeURIComponent(next)}`);
  }

  const profile = await getProfileForUser(supabase, authData.user);
  if (!profile) return { isSaved: false, error: "Le profil de votre compte est introuvable." };
  if (profile.account_role !== "candidate") redirect(roleHome(profile.account_role));

  const { error: candidateError } = await supabase
    .from("candidates")
    .upsert({ profile_id: authData.user.id }, { onConflict: "profile_id" });
  if (candidateError) return { isSaved: false, error: "Impossible de préparer votre profil candidat." };

  const { data: savedJob, error: lookupError } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("candidate_id", authData.user.id)
    .eq("job_id", jobId.data)
    .maybeSingle();
  if (lookupError) return { isSaved: false, error: "Impossible de vérifier vos offres sauvegardées." };

  if (savedJob) {
    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("candidate_id", authData.user.id)
      .eq("job_id", jobId.data);
    if (error) return { isSaved: true, error: "Impossible de retirer l’offre de vos sauvegardes." };
  } else {
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, closes_at")
      .eq("id", jobId.data)
      .maybeSingle();
    if (jobError) return { isSaved: false, error: "Impossible de vérifier cette offre." };
    if (!job || job.status !== "published" || (job.closes_at && new Date(job.closes_at) <= new Date())) {
      return { isSaved: false, error: "Cette offre n’est plus disponible." };
    }

    const { error } = await supabase.from("saved_jobs").insert({
      candidate_id: authData.user.id,
      job_id: jobId.data,
    });
    if (error) return { isSaved: false, error: "Impossible de sauvegarder cette offre." };
  }

  revalidatePath("/emplois");
  if (slug.data) revalidatePath(`/emplois/${slug.data}`);
  revalidatePath("/candidate");
  revalidatePath("/candidate/offres");
  revalidatePath("/candidate/offres/sauvegardees");
  return { isSaved: !savedJob };
}
