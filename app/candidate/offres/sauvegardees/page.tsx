import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { JobListingCard } from "@/components/jobs/job-listing-card";
import { SavedJobButton } from "@/components/jobs/saved-job-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSavedJobListings } from "@/lib/jobs/queries";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Offres sauvegardées" };

export default async function SavedJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase, user } = await requireRole("candidate");
  const { page: rawPage } = await searchParams;
  const pageValue = Number(rawPage);
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 && pageValue <= 100_000 ? pageValue : 1;
  const result = await getSavedJobListings(supabase, user.id, page);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-primary">Mon espace candidat</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Offres sauvegardées</h1>
        <p className="mt-2 text-muted-foreground">Retrouvez les opportunités que vous souhaitez consulter plus tard.</p>
      </header>

      {result.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <span className="rounded-full bg-primary/10 p-4 text-primary"><Bookmark aria-hidden="true" className="h-7 w-7" /></span>
            <h2 className="mt-4 text-xl font-semibold">Aucune offre sauvegardée</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Sauvegardez une offre pour la retrouver facilement ici.</p>
            <Button asChild className="mt-5"><Link href="/emplois">Parcourir les offres</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {result.jobs.map((job) => (
              <JobListingCard initialSaved job={job} key={job.id} />
            ))}
            {result.unavailable.map((saved) => (
              <Card key={saved.job_id}>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-lg bg-secondary p-3 text-muted-foreground"><Clock3 aria-hidden="true" className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <p className="font-semibold">Cette offre n’est plus disponible</p>
                      <p className="mt-1 text-sm text-muted-foreground">Vous pouvez la retirer de vos sauvegardes.</p>
                    </div>
                  </div>
                  <SavedJobButton initialSaved jobId={saved.job_id} />
                </CardContent>
              </Card>
            ))}
          </div>
          {result.total > result.pageSize && (
            <nav aria-label="Pagination des offres sauvegardées" className="flex items-center justify-between">
              {page > 1 ? (
                <Button asChild variant="outline"><Link href={`/candidate/offres/sauvegardees?page=${page - 1}`}><ChevronLeft className="h-4 w-4" />Précédent</Link></Button>
              ) : <span />}
              <span className="text-sm text-muted-foreground">Page {page} sur {totalPages}</span>
              {page < totalPages ? (
                <Button asChild variant="outline"><Link href={`/candidate/offres/sauvegardees?page=${page + 1}`}>Suivant<ChevronRight className="h-4 w-4" /></Link></Button>
              ) : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
