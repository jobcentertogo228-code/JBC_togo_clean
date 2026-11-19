import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Search, SlidersHorizontal } from "lucide-react";
import { JobCard } from "@/components/candidate/job-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRecommendedJobs } from "@/lib/candidate/queries";
import { requireRole } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Offres recommandées" };

export default async function RecommendedJobsPage() {
  const { supabase, user } = await requireRole("candidate");
  const jobs = await getRecommendedJobs(supabase, user.id, 30);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Mon espace candidat</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Offres recommandées</h1>
          <p className="mt-2 text-muted-foreground">Des offres récentes à explorer selon vos compétences.</p>
        </div>
        <div className="flex items-center gap-3">
          <BadgeWithCount count={jobs.length} />
          <Button asChild size="sm" variant="outline">
            <Link href="/emplois"><Search className="h-4 w-4" />Toutes les offres</Link>
          </Button>
        </div>
      </div>
      {!jobs.length ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <span className="rounded-full bg-primary/10 p-4 text-primary"><BriefcaseBusiness className="h-7 w-7" /></span>
            <h2 className="mt-4 text-xl font-semibold">Aucune offre disponible</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Revenez bientôt ou améliorez votre profil pour obtenir des recommandations pertinentes.
            </p>
            <Button asChild className="mt-5" variant="secondary">
              <Link href="/candidate/profil"><SlidersHorizontal className="h-4 w-4" />Compléter mon profil</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert variant="info">
            Les recommandations sont actuellement basées sur vos compétences enregistrées et les offres les plus récentes.
          </Alert>
          <div className="grid gap-4 lg:grid-cols-2">
            {jobs.map((job) => <JobCard job={job} key={job.id} />)}
          </div>
        </>
      )}
    </div>
  );
}

function BadgeWithCount({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
      {count} offre{count > 1 ? "s" : ""}
    </span>
  );
}
