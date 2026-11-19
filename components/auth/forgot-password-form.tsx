"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { SubmitButton } from "@/components/auth/submit-button";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, {});

  return (
    <form className="form-stack" action={formAction}>
      <label className="form-field">
        Adresse e-mail
        <input autoComplete="email" name="email" type="email" required />
      </label>
      <AuthFeedback state={state} />
      <SubmitButton pendingLabel="Envoi…">Envoyer le lien</SubmitButton>
    </form>
  );
}
