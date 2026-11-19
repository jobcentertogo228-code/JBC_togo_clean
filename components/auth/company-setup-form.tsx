"use client";

import { useActionState } from "react";
import { completeCompanySetupAction } from "@/app/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { SubmitButton } from "@/components/auth/submit-button";

export function CompanySetupForm({
  initialName,
  initialSlug,
}: {
  initialName: string;
  initialSlug: string;
}) {
  const [state, formAction] = useActionState(completeCompanySetupAction, {});

  return (
    <form className="form-stack" action={formAction}>
      <label className="form-field">
        Nom de l’entreprise
        <input name="companyName" defaultValue={initialName} required minLength={2} maxLength={180} />
      </label>
      <label className="form-field">
        Identifiant public
        <input
          name="companySlug"
          defaultValue={initialSlug}
          maxLength={180}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
      </label>
      <AuthFeedback state={state} />
      <SubmitButton pendingLabel="Configuration…">Créer l’espace entreprise</SubmitButton>
    </form>
  );
}
