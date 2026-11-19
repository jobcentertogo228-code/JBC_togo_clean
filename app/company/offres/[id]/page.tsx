import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobPublicationForm } from "@/components/company/job-publication-form";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Modifier une offre" };

export default async function EditCompanyJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireRole("company");
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, company_id, title, domain, description, requirements, benefits, city, country_code, workplace_type, salary_min, salary_max, employment_type, minimum_education_level, experience_level, experience_min_years, closes_at, status")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Impossible de charger l’offre : ${error.message}`);
  if (!job) notFound();

  const { data: membership, error: membershipError } = await supabase
    .from("company_memberships")
    .select("role")
    .eq("company_id", job.company_id)
    .eq("profile_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw new Error(`Impossible de vérifier vos droits sur l’offre : ${membershipError.message}`);
  if (!membership || !["owner", "admin", "recruiter"].includes(membership.role)) notFound();
  if (["archived", "closed"].includes(job.status)) notFound();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", job.company_id)
    .maybeSingle();
  if (companyError) throw new Error(`Impossible de charger l’entreprise : ${companyError.message}`);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild className="mb-4" variant="ghost"><Link href="/company/offres">← Retour à mes offres</Link></Button>
        <p className="text-sm font-semibold text-primary">Recrutement · {company.name}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Modifier une offre</h1>
      </div>
      <JobPublicationForm
        companies={[{ id: company.id, name: company.name }]}
        initial={{
          id: job.id,
          companyId: job.company_id,
          title: job.title,
          domain: job.domain ?? "",
          description: job.description,
          requirements: job.requirements ?? "",
          benefits: job.benefits ?? "",
          city: job.city ?? "",
          countryCode: job.country_code.trim(),
          workplaceType: job.workplace_type,
          salaryMin: job.salary_min?.toString() ?? "",
          salaryMax: job.salary_max?.toString() ?? "",
          employmentType: job.employment_type,
          minimumEducationLevel: job.minimum_education_level ?? "",
          experienceLevel: job.experience_level ?? "",
          experienceMinYears: job.experience_min_years?.toString() ?? "",
          closesAt: job.closes_at?.slice(0, 10) ?? "",
        }}
      />
    </div>
  );
}
