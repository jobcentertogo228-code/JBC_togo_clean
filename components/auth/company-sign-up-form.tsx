"use client";

import { useActionState } from "react";
import { signUpCompanyAction } from "@/app/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { SubmitButton } from "@/components/auth/submit-button";

export function CompanySignUpForm() {
  const [state, formAction] = useActionState(signUpCompanyAction, {});

  return (
    <form className="form-stack" action={formAction}>
      <label className="form-field">
        Votre nom complet
        <input autoComplete="name" name="fullName" required maxLength={120} />
      </label>
      <label className="form-field">
        Nom de l’entreprise
        <input name="companyName" required minLength={2} maxLength={180} />
      </label>
      <label className="form-field">
        Identifiant public de l’entreprise
        <input
          autoComplete="off"
          name="companySlug"
          maxLength={180}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="exemple-entreprise"
          required
        />
      </label>
      <label className="form-field">
        Adresse e-mail professionnelle
        <input autoComplete="email" name="email" type="email" required />
      </label>
      <label className="form-field">
        Mot de passe (10 caractères minimum)
        <input autoComplete="new-password" name="password" type="password" minLength={10} required />
      </label>
      <AuthFeedback state={state} />
      <SubmitButton pendingLabel="Création de l’espace…">Créer mon espace entreprise</SubmitButton>
    </form>
  );
}
