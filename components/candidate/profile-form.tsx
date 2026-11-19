"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveCandidateProfileAction } from "@/app/actions/candidate";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { CandidateAvatarUpload } from "@/components/candidate/candidate-avatar-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const currentStatuses = [
  ["", "Sélectionnez votre situation"],
  ["employed", "En poste"],
  ["unemployed", "En recherche d’emploi"],
  ["student", "Étudiant(e)"],
  ["freelance", "Indépendant(e)"],
  ["other", "Autre"],
];

const availabilities = [
  ["", "Sélectionnez votre disponibilité"],
  ["immediate", "Immédiate"],
  ["two_weeks", "Sous deux semaines"],
  ["one_month", "Sous un mois"],
  ["three_months", "Sous trois mois"],
  ["negotiable", "À convenir"],
];

export type CandidateProfileInitial = {
  candidateCode: string;
  candidateId: string;
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  displayName: string;
  headline: string;
  summary: string;
  address: string;
  city: string;
  countryCode: string;
  birthDate: string;
  nationality: string;
  currentStatus: string;
  availability: string;
  yearsExperience: string;
  desiredSalaryMin: string;
  desiredSalaryMax: string;
};

export function CandidateProfileForm({ initial }: { initial: CandidateProfileInitial }) {
  const [state, formAction, pending] = useActionState(saveCandidateProfileAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRevision = useRef(0);
  const failedRevision = useRef<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges || pending || failedRevision.current === revision) return;
    const timer = window.setTimeout(() => {
      submittedRevision.current = revision;
      formRef.current?.requestSubmit();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [hasChanges, pending, revision]);

  useEffect(() => {
    if (state.error && submittedRevision.current === revision) {
      failedRevision.current = revision;
    }
    if (state.message && submittedRevision.current === revision) {
      setHasChanges(false);
    }
  }, [revision, state.error, state.message]);

  function handleChange() {
    setHasChanges(true);
    setRevision((value) => value + 1);
  }

  return (
    <div className="space-y-5">
      <CandidateAvatarUpload
        candidateId={initial.candidateId}
        displayName={`${initial.firstName} ${initial.lastName}`.trim()}
        photoUrl={initial.photoUrl}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Informations du candidat</CardTitle>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
              {initial.candidateCode}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <form
            action={formAction}
            className="space-y-5"
            onChange={handleChange}
            onSubmit={() => {
              submittedRevision.current = revision;
              failedRevision.current = null;
            }}
            ref={formRef}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input autoComplete="given-name" defaultValue={initial.firstName} id="firstName" maxLength={80} name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input autoComplete="family-name" defaultValue={initial.lastName} id="lastName" maxLength={80} name="lastName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input autoComplete="tel" defaultValue={initial.phone} id="phone" maxLength={40} name="phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input autoComplete="bday" defaultValue={initial.birthDate} id="birthDate" max={new Date().toISOString().slice(0, 10)} name="birthDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationalité</Label>
                <Input autoComplete="country-name" defaultValue={initial.nationality} id="nationality" maxLength={80} name="nationality" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nom affiché aux recruteurs</Label>
                <Input defaultValue={initial.displayName} id="displayName" maxLength={120} name="displayName" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input autoComplete="street-address" defaultValue={initial.address} id="address" maxLength={240} name="address" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input autoComplete="address-level2" defaultValue={initial.city} id="city" maxLength={120} name="city" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryCode">Pays (code ISO)</Label>
                <Input autoComplete="country" defaultValue={initial.countryCode} id="countryCode" maxLength={2} name="countryCode" pattern="[A-Za-z]{2}" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headline">Titre professionnel</Label>
                <Input defaultValue={initial.headline} id="headline" maxLength={160} name="headline" placeholder="Ex. Assistante de gestion" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Années d’expérience</Label>
                <Input defaultValue={initial.yearsExperience} id="yearsExperience" max="80" min="0" name="yearsExperience" step="0.5" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStatus">Situation actuelle</Label>
                <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={initial.currentStatus} id="currentStatus" name="currentStatus">
                  {currentStatuses.map(([value, label]) => <option key={value || "empty"} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Disponibilité</Label>
                <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={initial.availability} id="availability" name="availability">
                  {availabilities.map(([value, label]) => <option key={value || "empty"} value={value}>{label}</option>)}
                </select>
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Prétentions salariales mensuelles (XOF)</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="desiredSalaryMin">Minimum souhaité</Label>
                  <Input defaultValue={initial.desiredSalaryMin} id="desiredSalaryMin" min="0" name="desiredSalaryMin" step="1" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desiredSalaryMax">Maximum souhaité</Label>
                  <Input defaultValue={initial.desiredSalaryMax} id="desiredSalaryMax" min="0" name="desiredSalaryMax" step="1" type="number" />
                </div>
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="summary">Présentation professionnelle</Label>
              <Textarea defaultValue={initial.summary} id="summary" maxLength={10000} name="summary" placeholder="Présentez vos compétences et votre parcours en quelques phrases." rows={6} />
            </div>
            <AuthFeedback state={state} />
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={pending} type="submit">
                {pending ? "Enregistrement…" : "Enregistrer mon profil"}
              </Button>
              <span aria-live="polite" className="text-xs text-muted-foreground">
                {pending ? "Enregistrement en cours…" : hasChanges ? "Enregistrement automatique après votre saisie." : state.message ? "Toutes les modifications sont enregistrées." : ""}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
