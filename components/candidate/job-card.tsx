import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { ApplyToJobForm } from "@/components/candidate/apply-to-job-form";
import { SavedJobButton } from "@/components/jobs/saved-job-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  employmentLabel,
  formatDate,
  formatSalary,
  workplaceLabel,
  type JobCardData,
} from "@/lib/candidate/queries";

export function JobCard({
  job,
  showActions = false,
  initialSaved = false,
}: {
  job: JobCardData;
  showActions?: boolean;
  initialSaved?: boolean;
}) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 rounded-lg" imageUrl={job.companyLogo} name={job.companyName} />
          <div className="min-w-0 flex-1">
            <Link
              className="line-clamp-2 font-semibold leading-5 text-foreground hover:text-primary"
              href={`/candidate/offres/${job.slug}`}
            >
              {job.title}
            </Link>
            <p className="mt-1 truncate text-sm text-muted-foreground">{job.companyName}</p>
          </div>
          <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.city || "Togo"}</span>
          <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{workplaceLabel(job.workplace_type)}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{employmentLabel(job.employment_type)}</Badge>
            <span className={salary ? "self-center text-xs font-medium text-foreground" : "self-center text-xs text-muted-foreground"}>
              {salary ?? "Salaire non précisé"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(job.published_at)}</span>
        </div>
        {showActions && (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-t border-border pt-4">
            <ApplyToJobForm compact jobId={job.id} />
            <SavedJobButton initialSaved={initialSaved} jobId={job.id} slug={job.slug} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
