"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteResumeAction } from "@/app/actions/candidate";
import { Button } from "@/components/ui/button";

export function ResumeDeleteForm({ resumeId }: { resumeId: string }) {
  const [state, formAction, pending] = useActionState(deleteResumeAction, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input name="resumeId" type="hidden" value={resumeId} />
      <Button
        aria-label="Supprimer le CV"
        disabled={pending}
        size="icon"
        type="submit"
        variant="ghost"
      >
        {pending
          ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          : <Trash2 aria-hidden="true" className="h-4 w-4 text-destructive" />}
      </Button>
      {state.error && <span className="max-w-48 text-right text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
