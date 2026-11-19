import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { SavedJobButton } from "@/components/jobs/saved-job-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  employmentLabel,
  experienceLabel,
  formatJobDate,
  formatJobSalary,
  workplaceLabel,
  type JobListing,
} from "@/lib/jobs/queries";

export function JobListingCard({
  job,
  initialSaved = false,
  canSave = true,
}: {
  job: JobListing;
  initialSaved?: boolean;
  canSave?: boolean;
}) {
  const salary = formatJobSalary(job.salary_min, job.salary_max, job.salary_currency);
  const experience = experienceLabel(job.experience_level, job.experience_min_years);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 rounded-lg" imageUrl={job.companyLogo} name={job.companyName} />
          <div className="min-w-0 flex-1">
            <Link
              className="line-clamp-2 font-semibold leading-5 text-foreground hover:text-primary"
              href={`/emplois/${job.slug}`}
            >
              {job.title}
            </Link>
            <p className="mt-1 truncate text-sm text-muted-foreground">{job.companyName}</p>
          </div>
          {canSave && <SavedJobButton compact initialSaved={initialSaved} jobId={job.id} slug={job.slug} />}
        </div>

        {job.summary && <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{job.summary}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {job.domain && <Badge variant="info">{job.domain}</Badge>}
          <Badge variant="secondary">{employmentLabel(job.employment_type)}</Badge>
          {experience && <Badge variant="outline">{experience}</Badge>}
          <Badge variant="outline">{workplaceLabel(job.workplace_type)}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {job.city || "Togo"}
            </span>
            <span className="inline-flex items-center gap-1">
              <BriefcaseBusiness aria-hidden="true" className="h-3.5 w-3.5" />
              {formatJobDate(job.published_at)}
            </span>
          </div>
          {salary && <span className="text-sm font-semibold text-slate-800">{salary}</span>}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary" href={`/emplois/${job.slug}`}>
            Consulter l’offre <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
