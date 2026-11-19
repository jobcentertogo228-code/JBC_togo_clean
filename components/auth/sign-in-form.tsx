"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { SubmitButton } from "@/components/auth/submit-button";

export function SignInForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(signInAction, {});

  return (
    <form className="form-stack" action={formAction}>
      <input type="hidden" name="next" value={nextPath} />
      <label className="form-field">
        Adresse e-mail
        <input autoComplete="email" name="email" type="email" required />
      </label>
      <label className="form-field">
        Mot de passe
        <input autoComplete="current-password" name="password" type="password" required />
      </label>
      <AuthFeedback state={state} />
      <SubmitButton pendingLabel="Connexion…" >Se connecter</SubmitButton>
      <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
    </form>
  );
}
