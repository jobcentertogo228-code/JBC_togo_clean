"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCompanyApplicationStatusAction } from "@/app/actions/company";
import { ApplicationStatusBadge } from "@/components/candidate/application-status-badge";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApplicationStatus } from "@/types/database";

const terminalStatuses: ApplicationStatus[] = ["accepted", "rejected", "withdrawn"];

export function ApplicationStatusForm({
  applicationId,
  initialStatus,
  interviewAt,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
  interviewAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateCompanyApplicationStatusAction, {});
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => setStatus(initialStatus), [initialStatus]);

  if (terminalStatuses.includes(initialStatus)) {
    return <ApplicationStatusBadge status={initialStatus} />;
  }

  const interviewAtInput = interviewAt ? new Date(interviewAt).toISOString().slice(0, 16) : "";

  return (
    <form action={formAction} className="w-full space-y-3 sm:max-w-xs">
      <input name="applicationId" type="hidden" value={applicationId} />
      <div className="space-y-1.5">
        <Label htmlFor={`status-${applicationId}`}>Faire avancer la candidature</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          id={`status-${applicationId}`}
          name="status"
          onChange={(event) => {
            const value = event.target.value;
            if (
              value === "submitted"
              || value === "under_review"
              || value === "shortlisted"
              || value === "interview"
              || value === "accepted"
              || value === "rejected"
            ) {
              setStatus(value);
            }
          }}
          value={status}
        >
          {initialStatus === "submitted" && <option disabled value="submitted">Candidature reçue</option>}
          <option value="under_review">En cours d’examen</option>
          <option value="shortlisted">Présélectionné</option>
          <option value="interview">Entretien programmé</option>
          <option value="accepted">Accepter la candidature</option>
          <option value="rejected">Refuser la candidature</option>
        </select>
      </div>
      {status === "interview" && (
        <div className="space-y-1.5">
          <Label htmlFor={`interviewAt-${applicationId}`}>Date et heure (heure du Togo)</Label>
          <Input
            defaultValue={interviewAtInput}
            id={`interviewAt-${applicationId}`}
            key={`${applicationId}-${interviewAtInput}`}
            name="interviewAt"
            required
            type="datetime-local"
          />
        </div>
      )}
      <AuthFeedback state={state} />
      <Button disabled={pending} size="sm" type="submit" variant="outline">
        {pending ? "Mise à jour…" : "Enregistrer"}
      </Button>
    </form>
  );
}
