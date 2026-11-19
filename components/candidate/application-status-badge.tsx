import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types/database";

const statusPresentation: Record<
  ApplicationStatus,
  { label: string; variant: "info" | "warning" | "success" | "destructive" | "secondary" }
> = {
  submitted: { label: "Candidature envoyée", variant: "info" },
  under_review: { label: "En cours d’examen", variant: "warning" },
  shortlisted: { label: "Présélectionné", variant: "success" },
  interview: { label: "Entretien", variant: "success" },
  accepted: { label: "Acceptée", variant: "success" },
  rejected: { label: "Non retenue", variant: "destructive" },
  withdrawn: { label: "Retirée", variant: "secondary" },
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const presentation = statusPresentation[status];
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}
