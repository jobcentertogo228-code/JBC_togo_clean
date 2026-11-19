import type { Metadata } from "next";
import { CandidatePasswordForm, CandidateVisibilityForm } from "@/components/candidate/settings-forms";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/roles";
import { getCandidateRecord } from "@/lib/candidate/queries";

export const metadata: Metadata = { title: "Paramètres du compte" };

export default async function CandidateSettingsPage() {
  const { supabase, user } = await requireRole("candidate");
  const [candidate, profileResult] = await Promise.all([
    getCandidateRecord(supabase, user.id),
    supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle(),
  ]);

  if (profileResult.error) throw new Error(`Unable to load account settings: ${profileResult.error.message}`);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Mon espace candidat</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-2 text-muted-foreground">Gérez la confidentialité de votre profil et la sécurité de votre compte.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
          <CardDescription>Les informations liées à votre identité de connexion.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Adresse e-mail</p>
            <p className="mt-1 font-medium">{user.email ?? "Non renseignée"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Langue</p>
            <p className="mt-1 font-medium">{profileResult.data?.locale ?? "fr-TG"}</p>
          </div>
        </CardContent>
      </Card>
      <CandidateVisibilityForm value={candidate?.visibility ?? "companies_only"} />
      <CandidatePasswordForm />
      <Alert variant="info">
        Pour modifier votre adresse e-mail ou supprimer votre compte, contactez l’assistance JOB-CENTER.
      </Alert>
    </div>
  );
}
