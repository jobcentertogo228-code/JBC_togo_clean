"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { SubmitButton } from "@/components/auth/submit-button";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, {});

  return (
    <form className="form-stack" action={formAction}>
      <label className="form-field">
        Nouveau mot de passe
        <input autoComplete="new-password" name="password" type="password" minLength={10} required />
      </label>
      <label className="form-field">
        Confirmer le mot de passe
        <input autoComplete="new-password" name="confirmPassword" type="password" minLength={10} required />
      </label>
      <AuthFeedback state={state} />
      <SubmitButton pendingLabel="Mise à jour…">Réinitialiser le mot de passe</SubmitButton>
    </form>
  );
}
