"use client";

import { useActionState } from "react";
import {
  changeCandidatePasswordAction,
  saveCandidateVisibilityAction,
} from "@/app/actions/candidate";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CandidateVisibilityForm({ value }: { value: "private" | "companies_only" | "public" }) {
  const [state, formAction, pending] = useActionState(saveCandidateVisibilityAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visibilité du profil</CardTitle>
        <CardDescription>Choisissez qui peut consulter votre profil professionnel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-3">
            <VisibilityOption
              checked={value === "companies_only"}
              description="Les utilisateurs associés à une entreprise peuvent trouver votre profil."
              label="Entreprises uniquement"
              value="companies_only"
            />
            <VisibilityOption
              checked={value === "public"}
              description="Votre profil professionnel peut être visible publiquement."
              label="Public"
              value="public"
            />
            <VisibilityOption
              checked={value === "private"}
              description="Seul votre compte peut consulter votre profil."
              label="Privé"
              value="private"
            />
          </div>
          <AuthFeedback state={state} />
          <Button disabled={pending} type="submit">{pending ? "Enregistrement…" : "Enregistrer la confidentialité"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function VisibilityOption({
  checked,
  description,
  label,
  value,
}: {
  checked: boolean;
  description: string;
  label: string;
  value: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50">
      <input className="mt-1 accent-primary" defaultChecked={checked} name="visibility" type="radio" value={value} />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function CandidatePasswordForm() {
  const [state, formAction, pending] = useActionState(changeCandidatePasswordAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe</CardTitle>
        <CardDescription>Choisissez un mot de passe unique d’au moins 10 caractères.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input autoComplete="new-password" id="password" minLength={10} name="password" required type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input autoComplete="new-password" id="confirmPassword" minLength={10} name="confirmPassword" required type="password" />
          </div>
          <AuthFeedback state={state} />
          <Button disabled={pending} type="submit">{pending ? "Mise à jour…" : "Modifier le mot de passe"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
