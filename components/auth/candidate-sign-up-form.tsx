"use client";

import { useActionState } from "react";
import { signUpCandidateAction } from "@/app/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { SubmitButton } from "@/components/auth/submit-button";

export function CandidateSignUpForm({ nextPath = "" }: { nextPath?: string }) {
  const [state, formAction] = useActionState(signUpCandidateAction, {});

  return (
    <form className="form-stack" action={formAction}>
      <input name="next" type="hidden" value={nextPath} />
      <label className="form-field">
        Nom complet
        <input autoComplete="name" name="fullName" required maxLength={120} />
      </label>
      <label className="form-field">
        Adresse e-mail
        <input autoComplete="email" name="email" type="email" required />
      </label>
      <label className="form-field">
        Mot de passe (10 caractères minimum)
        <input autoComplete="new-password" name="password" type="password" minLength={10} required />
      </label>
      <AuthFeedback state={state} />
      <SubmitButton pendingLabel="Création du compte…">Créer mon compte</SubmitButton>
    </form>
  );
}
