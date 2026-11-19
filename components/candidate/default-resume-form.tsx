"use client";

import { useActionState } from "react";
import { LoaderCircle, Star } from "lucide-react";
import { setDefaultResumeAction } from "@/app/actions/candidate";
import { Button } from "@/components/ui/button";

export function DefaultResumeForm({ resumeId }: { resumeId: string }) {
  const [state, formAction, pending] = useActionState(setDefaultResumeAction, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input name="resumeId" type="hidden" value={resumeId} />
      <Button disabled={pending} size="sm" type="submit" variant="outline">
        {pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Star aria-hidden="true" className="h-4 w-4" />}
        {pending ? "Mise à jour…" : "Définir principal"}
      </Button>
      {state.error && <span className="max-w-48 text-right text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
