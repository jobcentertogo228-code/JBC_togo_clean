"use client";

import { useActionState } from "react";
import { Bookmark, LoaderCircle } from "lucide-react";
import { toggleSavedJobAction } from "@/app/actions/candidate";
import { Button } from "@/components/ui/button";

export function SavedJobButton({
  jobId,
  slug,
  initialSaved,
  compact = false,
}: {
  jobId: string;
  slug?: string;
  initialSaved: boolean;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(toggleSavedJobAction, {
    isSaved: initialSaved,
  });

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input name="jobId" type="hidden" value={jobId} />
      {slug && <input name="slug" type="hidden" value={slug} />}
      <Button
        aria-label={state.isSaved ? "Retirer des offres sauvegardées" : "Sauvegarder cette offre"}
        aria-pressed={state.isSaved}
        disabled={pending}
        size={compact ? "icon" : "sm"}
        type="submit"
        variant={state.isSaved ? "secondary" : "outline"}
      >
        {pending
          ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          : <Bookmark aria-hidden="true" className={`h-4 w-4 ${state.isSaved ? "fill-current" : ""}`} />}
        {!compact && (state.isSaved ? "Sauvegardée" : "Sauvegarder")}
      </Button>
      {state.error && <span className="max-w-48 text-right text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
