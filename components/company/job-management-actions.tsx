"use client";

import { useActionState } from "react";
import {
  archiveCompanyJobAction,
  deleteCompanyJobAction,
} from "@/app/actions/company";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";

export function ArchiveJobForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(archiveCompanyJobAction, {});
  return (
    <form action={formAction} className="space-y-2">
      <input name="jobId" type="hidden" value={jobId} />
      {state.error && <AuthFeedback state={state} />}
      <Button disabled={pending} size="sm" type="submit" variant="outline">
        {pending ? "Archivage…" : "Archiver"}
      </Button>
    </form>
  );
}

export function DeleteJobForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(deleteCompanyJobAction, {});
  return (
    <form action={formAction} className="space-y-2">
      <input name="jobId" type="hidden" value={jobId} />
      {state.error && <AuthFeedback state={state} />}
      {state.message && <AuthFeedback state={state} />}
      <Button disabled={pending} size="sm" type="submit" variant="destructive">
        {pending ? "Suppression…" : "Supprimer"}
      </Button>
    </form>
  );
}
