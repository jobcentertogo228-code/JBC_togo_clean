import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, BriefcaseBusiness, ChevronLeft, ChevronRight } from "lucide-react";
import { JobListingCard } from "@/components/jobs/job-listing-card";
import { JobSearchForm } from "@/components/jobs/job-search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProfileForUser, roleHome } from "@/lib/auth/roles";
import { isAuthSessionMissingError } from "@/lib/auth/session";
import { getJobFilterOptions, getSavedJobIds, parseJobSearchFilters, searchPublishedJobs } from "@/lib/jobs/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Offres d’emploi",
  description: "Recherchez des offres d’emploi au Togo par métier, ville, domaine, contrat, salaire et expérience.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseJobSearchFilters(await searchParams);
  const supabase = await createSupabaseServerClient();
  const [results, domains, authResult] = await Promise.all([
    searchPublishedJobs(supabase, filters),
    getJobFilterOptions(supabase),
    supabase.auth.getUser(),
  ]);

  if (authResult.error && !isAuthSessionMissingError(authResult.error)) {
    throw new Error(`Impossible de vérifier la session : ${authResult.error.message}`);
  }

  let canSave = !authResult.data.user;
  let accountHref: string | null = null;
  let savedJobIds = new Set<string>();
  if (authResult.data.user) {
    const profile = await getProfileForUser(supabase, authResult.data.user);
    if (!profile) throw new Error("Le profil du compte connecté est introuvable.");
    accountHref = roleHome(profile.account_role);
    if (profile?.account_role === "candidate") {
      canSave = true;
      if (results.jobs.length > 0) {
        savedJobIds = await getSavedJobIds(
          supabase,
          authResult.data.user.id,
          results.jobs.map((job) => job.id),
        );
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(results.total / results.pageSize));
  const previousHref = pageHref(filters, filters.page - 1);
  const nextHref = pageHref(filters, filters.page + 1);

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
              <>
                <Link className="hidden text-slate-600 sm:inline" href="/connexion">Connexion</Link>
                <Button asChild size="sm"><Link href="/inscription">Créer un compte</Link></Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700 px-5 py-7 text-white sm:px-8 sm:py-9">
          <Badge className="border-white/20 bg-white/10 text-blue-50" variant="outline">Opportunités au Togo</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Trouvez le poste qui vous correspond</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
            Parcourez les nouvelles opportunités et affinez votre recherche selon vos critères.
          </p>
        </section>

        <JobSearchForm domains={domains} filters={filters} />

        <section className="mt-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Offres disponibles</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {results.total} résultat{results.total > 1 ? "s" : ""}
                {filters.q ? ` pour « ${filters.q} »` : ""}
              </p>
            </div>
            {authResult.data.user && canSave && (
              <Button asChild size="sm" variant="outline">
                <Link href="/candidate/offres/sauvegardees"><Bookmark className="h-4 w-4" />Mes offres sauvegardées</Link>
              </Button>
            )}
          </div>

          {results.jobs.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {results.jobs.map((job) => (
                <JobListingCard canSave={canSave} initialSaved={savedJobIds.has(job.id)} job={job} key={job.id} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <span className="rounded-full bg-secondary p-4 text-muted-foreground">
                  <BriefcaseBusiness aria-hidden="true" className="h-7 w-7" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">Aucune offre ne correspond à ces critères</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Essayez une autre ville, un autre domaine ou retirez certains filtres.
                </p>
                <Button asChild className="mt-4" variant="secondary"><Link href="/emplois">Effacer les filtres</Link></Button>
              </CardContent>
            </Card>
          )}

          {results.total > results.pageSize && (
            <nav aria-label="Pagination des offres" className="mt-7 flex items-center justify-between">
              {filters.page > 1 ? (
                <Button asChild variant="outline"><Link href={previousHref}><ChevronLeft className="h-4 w-4" />Précédent</Link></Button>
              ) : <span />}
              <span className="text-sm text-muted-foreground">Page {filters.page} sur {totalPages}</span>
              {filters.page < totalPages ? (
                <Button asChild variant="outline"><Link href={nextHref}>Suivant<ChevronRight className="h-4 w-4" /></Link></Button>
              ) : <span />}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

function pageHref(filters: ReturnType<typeof parseJobSearchFilters>, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  if (filters.domain) params.set("domain", filters.domain);
  if (filters.contract) params.set("contract", filters.contract);
  if (filters.experience) params.set("experience", filters.experience);
  if (filters.minSalary !== null) params.set("minSalary", filters.minSalary.toString());
  if (filters.postedWithin) params.set("postedWithin", filters.postedWithin);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  params.set("page", page.toString());
  return `/emplois?${params.toString()}`;
}
