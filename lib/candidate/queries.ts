import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationStatus, Database } from "@/types/database";

type CandidateClient = SupabaseClient<Database>;
type RecommendedJobRow = Pick<
  Database["public"]["Tables"]["jobs"]["Row"],
  | "id"
  | "company_id"
  | "title"
  | "slug"
  | "summary"
  | "city"
  | "country_code"
  | "employment_type"
  | "workplace_type"
  | "salary_min"
  | "salary_max"
  | "salary_currency"
  | "published_at"
  | "closes_at"
>;

export type JobCardData = {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  summary: string | null;
  city: string | null;
  country_code: string;
  employment_type: Database["public"]["Tables"]["jobs"]["Row"]["employment_type"];
  workplace_type: Database["public"]["Tables"]["jobs"]["Row"]["workplace_type"];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  published_at: string | null;
  companyName: string;
  companySlug: string;
  companyLogo: string | null;
};

export type ApplicationCardData = {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  job: Pick<JobCardData, "title" | "slug" | "companyName"> | null;
};

function throwOnError(label: string, error: { message: string } | null) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

export async function getCandidateRecord(supabase: CandidateClient, profileId: string) {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  throwOnError("Unable to load candidate profile", error);
  return data;
}

async function getCompanyDetails(supabase: CandidateClient, companyIds: string[]) {
  if (companyIds.length === 0) return new Map<string, { name: string; slug: string; logo_path: string | null }>();

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, logo_path")
    .in("id", [...new Set(companyIds)]);

  throwOnError("Unable to load company details", error);
  return new Map((data ?? []).map((company) => [company.id, company]));
}

async function mapJobCards(
  supabase: CandidateClient,
  jobs: Array<{
    id: string;
    company_id: string;
    title: string;
    slug: string;
    summary: string | null;
    city: string | null;
    country_code: string;
    employment_type: JobCardData["employment_type"];
    workplace_type: JobCardData["workplace_type"];
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string;
    published_at: string | null;
  }>,
): Promise<JobCardData[]> {
  const companies = await getCompanyDetails(supabase, jobs.map((job) => job.company_id));

  return jobs.map((job) => {
    const company = companies.get(job.company_id);
    return {
      ...job,
      companyName: company?.name ?? "Entreprise",
      companySlug: company?.slug ?? "",
      companyLogo: company?.logo_path?.startsWith("https://") ? company.logo_path : null,
    };
  });
}

export async function getCandidateSkillNames(supabase: CandidateClient, candidateId: string) {
  const { data: candidateSkills, error } = await supabase
    .from("candidate_skills")
    .select("skill_id")
    .eq("candidate_id", candidateId);

  throwOnError("Unable to load candidate skills", error);
  const skillIds = [...new Set((candidateSkills ?? []).map((skill) => skill.skill_id))];
  if (skillIds.length === 0) return [] as string[];

  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id, name")
    .in("id", skillIds)
    .order("name");

  throwOnError("Unable to load skill names", skillsError);
  return (skills ?? []).map((skill) => skill.name);
}

export async function getRecommendedJobs(
  supabase: CandidateClient,
  candidateId: string,
  limit = 6,
) {
  const { data: candidateSkills, error: skillError } = await supabase
    .from("candidate_skills")
    .select("skill_id")
    .eq("candidate_id", candidateId);

  throwOnError("Unable to load candidate skills", skillError);
  const skillIds = (candidateSkills ?? []).map((skill) => skill.skill_id);
  let matchedJobIds: string[] = [];

  if (skillIds.length > 0) {
    const { data: jobSkills, error } = await supabase
      .from("job_skills")
      .select("job_id")
      .in("skill_id", skillIds);

    throwOnError("Unable to match candidate skills", error);
    matchedJobIds = [...new Set((jobSkills ?? []).map((jobSkill) => jobSkill.job_id))];
  }

  const now = new Date().toISOString();
  let jobs: RecommendedJobRow[] = [];

  if (matchedJobIds.length > 0) {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, company_id, title, slug, summary, city, country_code, employment_type, workplace_type, salary_min, salary_max, salary_currency, published_at, closes_at")
      .in("id", matchedJobIds)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(30);

    throwOnError("Unable to load recommended jobs", error);
    jobs = (data ?? []).filter((job) => !job.closes_at || job.closes_at > now);
  }

  if (jobs.length === 0) {
    jobs = await queryPublishedJobs(supabase, now, 30);
  }

  return mapJobCards(supabase, jobs.slice(0, limit));
}

async function queryPublishedJobs(
  supabase: CandidateClient,
  now: string,
  limit: number,
): Promise<RecommendedJobRow[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, company_id, title, slug, summary, city, country_code, employment_type, workplace_type, salary_min, salary_max, salary_currency, published_at, closes_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  throwOnError("Unable to load published jobs", error);
  return (data ?? []).filter((job) => !job.closes_at || job.closes_at > now);
}

export async function getApplicationCards(supabase: CandidateClient, candidateId: string) {
  const { data: applications, error } = await supabase
    .from("applications")
    .select("id, job_id, status, submitted_at")
    .eq("candidate_id", candidateId)
    .order("submitted_at", { ascending: false });

  throwOnError("Unable to load applications", error);
  const rows = applications ?? [];
  if (rows.length === 0) return [] as ApplicationCardData[];

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, company_id, title, slug")
    .in("id", [...new Set(rows.map((application) => application.job_id))]);

  throwOnError("Unable to load application job details", jobsError);
  const companyDetails = await getCompanyDetails(supabase, (jobs ?? []).map((job) => job.company_id));
  const jobMap = new Map((jobs ?? []).map((job) => [job.id, job]));

  return rows.map((application) => {
    const job = jobMap.get(application.job_id);
    const company = job ? companyDetails.get(job.company_id) : null;
    return {
      id: application.id,
      status: application.status,
      submitted_at: application.submitted_at,
      job: job
        ? {
            title: job.title,
            slug: job.slug,
            companyName: company?.name ?? "Entreprise",
          }
        : null,
    };
  });
}

export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-TG", options ?? { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(value));
}

export function formatSalary(min: number | null, max: number | null, currency: string) {
  if (min === null && max === null) return null;
  const format = (amount: number) =>
    new Intl.NumberFormat("fr-TG", { maximumFractionDigits: 0 }).format(amount);

  if (min !== null && max !== null) return `${format(min)} – ${format(max)} ${currency}`;
  if (min !== null) return `À partir de ${format(min)} ${currency}`;
  if (max !== null) return `Jusqu’à ${format(max)} ${currency}`;
  return null;
}

export function employmentLabel(type: JobCardData["employment_type"]) {
  const labels: Record<JobCardData["employment_type"], string> = {
    full_time: "Temps plein",
    part_time: "Temps partiel",
    contract: "Contrat",
    internship: "Stage",
    temporary: "Temporaire",
  };
  return labels[type];
}

export function workplaceLabel(type: JobCardData["workplace_type"]) {
  const labels: Record<JobCardData["workplace_type"], string> = {
    onsite: "Sur site",
    hybrid: "Hybride",
    remote: "À distance",
  };
  return labels[type];
}
