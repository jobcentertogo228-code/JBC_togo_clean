"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { markNotificationReadAction } from "@/app/actions/candidate";
import { Button } from "@/components/ui/button";

export function NotificationReadForm({ notificationId }: { notificationId: string }) {
  const [state, formAction, pending] = useActionState(markNotificationReadAction, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input name="notificationId" type="hidden" value={notificationId} />
      <Button disabled={pending} size="sm" type="submit" variant="ghost">
        <Check aria-hidden="true" className="h-4 w-4" />
        {pending ? "Mise à jour…" : "Marquer comme lue"}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
