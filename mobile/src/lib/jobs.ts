import { getSupabase } from "@/src/lib/supabase";
import type { Database } from "@/types/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
export type Job = Pick<
  JobRow,
  | "id"
  | "company_id"
  | "title"
  | "slug"
  | "summary"
  | "domain"
  | "description"
  | "requirements"
  | "benefits"
  | "city"
  | "employment_type"
  | "workplace_type"
  | "salary_min"
  | "salary_max"
  | "salary_currency"
  | "experience_level"
  | "published_at"
  | "closes_at"
> & {
  companyName: string;
  companyLogo: string | null;
};

const listFields =
  "id, company_id, title, slug, summary, domain, description, requirements, benefits, city, employment_type, workplace_type, salary_min, salary_max, salary_currency, experience_level, published_at, closes_at";

async function addCompanyDetails(rows: Array<Pick<JobRow, "id" | "company_id" | "title" | "slug" | "summary" | "domain" | "description" | "requirements" | "benefits" | "city" | "employment_type" | "workplace_type" | "salary_min" | "salary_max" | "salary_currency" | "experience_level" | "published_at" | "closes_at">>): Promise<Job[]> {
  const companyIds = [...new Set(rows.map((job) => job.company_id))];
  if (!companyIds.length) return [];

  const { data: companies, error } = await getSupabase()
    .from("companies")
    .select("id, name, logo_path")
    .in("id", companyIds);
  if (error) throw new Error(`Impossible de charger les entreprises : ${error.message}`);

  const byId = new Map((companies ?? []).map((company) => [company.id, company]));
  return rows.map((job) => {
    const company = byId.get(job.company_id);
    return {
      ...job,
      companyName: company?.name ?? "Entreprise",
      companyLogo: company?.logo_path?.startsWith("https://") ? company.logo_path : null,
    };
  });
}

export async function searchJobs(search: string, city: string, limit = 30) {
  let query = getSupabase()
    .from("jobs")
    .select(listFields)
    .eq("status", "published")
    .or(`closes_at.is.null,closes_at.gt.${new Date().toISOString()}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (search.trim()) {
    query = query.textSearch("search_document", search.trim(), { config: "simple", type: "websearch" });
  }
  if (city.trim()) query = query.ilike("city", `%${city.trim()}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Impossible de rechercher les offres : ${error.message}`);
  return addCompanyDetails(data ?? []);
}

export async function getJobBySlug(slug: string) {
  const { data, error } = await getSupabase()
    .from("jobs")
    .select(listFields)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`Impossible de charger l’offre : ${error.message}`);
  if (!data || (data.closes_at && new Date(data.closes_at) <= new Date())) return null;
  const [job] = await addCompanyDetails([data]);
  return job ?? null;
}

export function formatSalary(min: number | null, max: number | null, currency: string) {
  if (min === null && max === null) return "Salaire non précisé";
  const format = (amount: number) => new Intl.NumberFormat("fr-TG", { maximumFractionDigits: 0 }).format(amount);
  if (min !== null && max !== null) return `${format(min)} – ${format(max)} ${currency}`;
  if (min !== null) return `À partir de ${format(min)} ${currency}`;
  return `Jusqu’à ${format(max ?? 0)} ${currency}`;
}

export function employmentLabel(type: Job["employment_type"]) {
  const labels: Record<Job["employment_type"], string> = {
    full_time: "Temps plein",
    part_time: "Temps partiel",
    contract: "Contrat",
    internship: "Stage",
    temporary: "Temporaire",
  };
  return labels[type];
}

export function workplaceLabel(type: Job["workplace_type"]) {
  const labels: Record<Job["workplace_type"], string> = {
    onsite: "Sur site",
    hybrid: "Hybride",
    remote: "À distance",
  };
  return labels[type];
}

export function formatDate(value: string | null) {
  if (!value) return "Publication récente";
  return new Intl.DateTimeFormat("fr-TG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
