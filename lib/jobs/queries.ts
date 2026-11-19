import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EducationLevel } from "@/types/database";

type JobsClient = SupabaseClient<Database>;

export type EmploymentType = Database["public"]["Tables"]["jobs"]["Row"]["employment_type"];
export type ExperienceLevel = NonNullable<Database["public"]["Tables"]["jobs"]["Row"]["experience_level"]>;

export type JobSearchFilters = {
  q: string;
  city: string;
  domain: string;
  contract: EmploymentType | "";
  experience: ExperienceLevel | "";
  minSalary: number | null;
  postedWithin: "day" | "week" | "month" | "";
  sort: "newest" | "salary_desc" | "salary_asc";
  page: number;
};

export type JobListing = {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  summary: string | null;
  domain: string | null;
  city: string | null;
  country_code: string;
  employment_type: EmploymentType;
  workplace_type: "onsite" | "hybrid" | "remote";
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  experience_level: ExperienceLevel | null;
  experience_min_years: number | null;
  published_at: string | null;
  companyName: string;
  companySlug: string;
  companyLogo: string | null;
};

export type SavedJobListing = JobListing & { savedAt: string };

const pageSize = 12;

const employmentTypes: EmploymentType[] = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
];

const experienceLevels: ExperienceLevel[] = [
  "internship",
  "junior",
  "mid",
  "senior",
  "executive",
];
const postedWithinOptions = ["day", "week", "month"] as const;
const sortOptions = ["newest", "salary_desc", "salary_asc"] as const;

export function parseJobSearchFilters(searchParams: Record<string, string | string[] | undefined>): JobSearchFilters {
  const value = (key: string) => {
    const raw = searchParams[key];
    return typeof raw === "string" ? raw.trim() : "";
  };
  const contractValue = value("contract");
  const experienceValue = value("experience");
  const postedWithinValue = value("postedWithin");
  const sortValue = value("sort");
  const minSalaryValue = Number(value("minSalary"));
  const pageValue = Number(value("page"));

  return {
    q: value("q").slice(0, 100),
    city: value("city").slice(0, 120),
    domain: value("domain").slice(0, 120),
    contract: employmentTypes.includes(contractValue as EmploymentType)
      ? contractValue as EmploymentType
      : "",
    experience: experienceLevels.includes(experienceValue as ExperienceLevel)
      ? experienceValue as ExperienceLevel
      : "",
    minSalary: Number.isSafeInteger(minSalaryValue) && minSalaryValue > 0 && minSalaryValue <= 100_000_000
      ? minSalaryValue
      : null,
    postedWithin: postedWithinOptions.includes(postedWithinValue as (typeof postedWithinOptions)[number])
      ? postedWithinValue as (typeof postedWithinOptions)[number]
      : "",
    sort: sortOptions.includes(sortValue as (typeof sortOptions)[number])
      ? sortValue as (typeof sortOptions)[number]
      : "newest",
    page: Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue <= 100_000
      ? pageValue
      : 1,
  };
}

export function employmentLabel(type: EmploymentType) {
  const labels: Record<EmploymentType, string> = {
    full_time: "Temps plein",
    part_time: "Temps partiel",
    contract: "Contrat",
    internship: "Stage",
    temporary: "Temporaire",
  };
  return labels[type];
}

export function experienceLabel(level: ExperienceLevel | null, years: number | null) {
  if (level) {
    const labels: Record<ExperienceLevel, string> = {
      internship: "Stage / débutant",
      junior: "Junior",
      mid: "Intermédiaire",
      senior: "Senior",
      executive: "Direction",
    };
    return labels[level];
  }
  if (years === null) return null;
  if (years === 0) return "Débutant accepté";
  return `${years} an${years > 1 ? "s" : ""} d’expérience`;
}

export function educationLevelLabel(level: EducationLevel | null) {
  if (!level) return null;

  const labels: Record<EducationLevel, string> = {
    none: "Aucun diplôme exigé",
    primary: "Primaire",
    secondary: "Collège (BEPC)",
    high_school: "Lycée (BAC)",
    bac_plus_2: "BAC+2 (BTS/DUT)",
    bachelor: "Licence",
    master: "Master",
    doctorate: "Doctorat",
  };
  return labels[level];
}

export function workplaceLabel(type: JobListing["workplace_type"]) {
  const labels: Record<JobListing["workplace_type"], string> = {
    onsite: "Sur site",
    hybrid: "Hybride",
    remote: "À distance",
  };
  return labels[type];
}

export function formatJobSalary(min: number | null, max: number | null, currency: string) {
  if (min === null && max === null) return null;
  const format = (amount: number) => new Intl.NumberFormat("fr-TG", { maximumFractionDigits: 0 }).format(amount);
  if (min !== null && max !== null) return `${format(min)} – ${format(max)} ${currency}`;
  if (min !== null) return `À partir de ${format(min)} ${currency}`;
  if (max !== null) return `Jusqu’à ${format(max)} ${currency}`;
  return null;
}

export function formatJobDate(value: string | null) {
  if (!value) return "Publication récente";
  return new Intl.DateTimeFormat("fr-TG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export async function getJobFilterOptions(supabase: JobsClient) {
  const { data, error } = await supabase
    .from("jobs")
    .select("domain")
    .eq("status", "published")
    .not("domain", "is", null)
    .order("domain")
    .limit(500);

  if (error) throw new Error(`Impossible de charger les domaines d’emploi : ${error.message}`);
  return [...new Set((data ?? []).map((job) => job.domain).filter((domain): domain is string => Boolean(domain)))];
}

export async function searchPublishedJobs(supabase: JobsClient, filters: JobSearchFilters) {
  let query = supabase
    .from("jobs")
    .select(
      "id, company_id, title, slug, summary, domain, city, country_code, employment_type, workplace_type, salary_min, salary_max, salary_currency, experience_level, experience_min_years, published_at",
      { count: "exact" },
    )
    .eq("status", "published");

  if (filters.sort === "salary_desc") {
    query = query
      .order("salary_max", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "salary_asc") {
    query = query
      .order("salary_min", { ascending: true, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  if (filters.q) {
    query = query.textSearch("search_document", filters.q, { config: "simple", type: "websearch" });
  }
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.domain) query = query.eq("domain", filters.domain);
  if (filters.contract) query = query.eq("employment_type", filters.contract);
  if (filters.experience) query = query.eq("experience_level", filters.experience);
  if (filters.minSalary !== null) {
    query = query
      .eq("salary_currency", "XOF")
      .not("salary_max", "is", null)
      .gte("salary_max", filters.minSalary);
  }
  if (filters.postedWithin) {
    const days = filters.postedWithin === "day" ? 1 : filters.postedWithin === "week" ? 7 : 30;
    query = query.gte("published_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
  }

  const from = (filters.page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(`Impossible de rechercher les offres : ${error.message}`);

  const jobs = data ?? [];
  const companyIds = [...new Set(jobs.map((job) => job.company_id))];
  const { data: companies, error: companiesError } = companyIds.length
    ? await supabase.from("companies").select("id, name, slug, logo_path").in("id", companyIds)
    : { data: [], error: null };
  if (companiesError) throw new Error(`Impossible de charger les entreprises : ${companiesError.message}`);

  const companyMap = new Map((companies ?? []).map((company) => [company.id, company]));
  const items: JobListing[] = jobs.map((job) => {
    const company = companyMap.get(job.company_id);
    return {
      ...job,
      companyName: company?.name ?? "Entreprise",
      companySlug: company?.slug ?? "",
      companyLogo: company?.logo_path?.startsWith("https://") ? company.logo_path : null,
    };
  });

  return { jobs: items, total: count ?? 0, pageSize };
}

export async function getSavedJobIds(supabase: JobsClient, candidateId: string, jobIds: string[]) {
  if (jobIds.length === 0) return new Set<string>();
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("candidate_id", candidateId)
    .in("job_id", jobIds);

  if (error) throw new Error(`Impossible de charger les offres sauvegardées : ${error.message}`);
  return new Set((data ?? []).map((row) => row.job_id));
}

export async function getSavedJobListings(supabase: JobsClient, candidateId: string, page = 1) {
  const { data: savedRows, count, error } = await supabase
    .from("saved_jobs")
    .select("job_id, saved_at", { count: "exact" })
    .eq("candidate_id", candidateId)
    .order("saved_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw new Error(`Impossible de charger vos offres sauvegardées : ${error.message}`);
  const saved = savedRows ?? [];
  if (saved.length === 0) return { jobs: [] as SavedJobListing[], unavailable: [], total: count ?? 0, pageSize };

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select(
      "id, company_id, title, slug, summary, domain, city, country_code, employment_type, workplace_type, salary_min, salary_max, salary_currency, experience_level, experience_min_years, published_at",
    )
    .in("id", saved.map((row) => row.job_id));
  if (jobsError) throw new Error(`Impossible de charger le détail des offres sauvegardées : ${jobsError.message}`);

  const rows = jobs ?? [];
  const companyIds = [...new Set(rows.map((job) => job.company_id))];
  const { data: companies, error: companiesError } = companyIds.length
    ? await supabase.from("companies").select("id, name, slug, logo_path").in("id", companyIds)
    : { data: [], error: null };
  if (companiesError) throw new Error(`Impossible de charger les entreprises : ${companiesError.message}`);

  const companyMap = new Map((companies ?? []).map((company) => [company.id, company]));
  const jobsById = new Map(rows.map((job) => [job.id, job]));
  const savedAtById = new Map(saved.map((row) => [row.job_id, row.saved_at]));
  const jobsBySavedDate: SavedJobListing[] = [];

  for (const row of saved) {
    const job = jobsById.get(row.job_id);
    if (!job) continue;
    const company = companyMap.get(job.company_id);
    jobsBySavedDate.push({
      ...job,
      companyName: company?.name ?? "Entreprise",
      companySlug: company?.slug ?? "",
      companyLogo: company?.logo_path?.startsWith("https://") ? company.logo_path : null,
      savedAt: savedAtById.get(job.id) ?? row.saved_at,
    });
  }

  const visibleIds = new Set(jobsBySavedDate.map((job) => job.id));
  return {
    jobs: jobsBySavedDate,
    unavailable: saved.filter((row) => !visibleIds.has(row.job_id)),
    total: count ?? 0,
    pageSize,
  };
}
