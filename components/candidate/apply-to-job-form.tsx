"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { applyToJobAction } from "@/app/actions/candidate";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ApplyToJobForm({
  jobId,
  compact = false,
}: {
  jobId: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(applyToJobAction, {});

  return (
    <form action={formAction} className={compact ? "min-w-0" : "space-y-3"}>
      <input name="jobId" type="hidden" value={jobId} />
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <Button className="w-full" disabled={pending} size={compact ? "sm" : "lg"} type="submit">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? "Envoi…" : compact ? "Postuler" : "Postuler en un clic"}
      </Button>
      {!compact && (
        <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" /> Votre CV principal ou le plus récent sera joint automatiquement.
        </p>
      )}
    </form>
  );
}
