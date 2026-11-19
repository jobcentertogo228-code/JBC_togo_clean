import type { Metadata } from "next";
import Link from "next/link";
import { JobPublicationForm } from "@/components/company/job-publication-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Publier une offre d’emploi" };

export default async function NewCompanyJobPage() {
  const { supabase, user } = await requireRole("company");
  const { data: memberships, error: membershipsError } = await supabase
    .from("company_memberships")
    .select("company_id, role")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin", "recruiter"]);

  if (membershipsError) {
    throw new Error(`Impossible de charger les entreprises autorisées : ${membershipsError.message}`);
  }

  const companyIds = (memberships ?? []).map((membership) => membership.company_id);
  const { data: companies, error: companiesError } = companyIds.length
    ? await supabase.from("companies").select("id, name").in("id", companyIds).order("name")
    : { data: [], error: null };

  if (companiesError) {
    throw new Error(`Impossible de charger les entreprises autorisées : ${companiesError.message}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild className="mb-4" variant="ghost">
          <Link href="/company">← Retour à l’espace entreprise</Link>
        </Button>
        <p className="text-sm font-semibold text-primary">Recrutement</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Publier une offre d’emploi</h1>
        <p className="mt-2 text-muted-foreground">
          Complétez les informations du poste. L’offre sera visible immédiatement par les candidats.
        </p>
      </div>

      {companies?.length ? (
        <JobPublicationForm companies={companies} />
      ) : (
        <Alert variant="info">
          Aucun compte entreprise actif ne dispose des droits de publication. Demandez à un propriétaire ou
          administrateur de vous attribuer le rôle recruteur.
        </Alert>
      )}
    </div>
  );
}
