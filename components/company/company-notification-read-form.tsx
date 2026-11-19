"use client";

import { useActionState } from "react";
import { markCompanyNotificationReadAction } from "@/app/actions/company";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";

export function CompanyNotificationReadForm({ notificationId }: { notificationId: string }) {
  const [state, formAction, pending] = useActionState(markCompanyNotificationReadAction, {});

  return (
    <form action={formAction} className="space-y-2">
      <input name="notificationId" type="hidden" value={notificationId} />
      {state.error && <AuthFeedback state={state} />}
      <Button disabled={pending} size="sm" type="submit" variant="outline">
        {pending ? "Mise à jour…" : "Marquer comme lue"}
      </Button>
    </form>
  );
}
