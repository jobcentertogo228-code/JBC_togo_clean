"use client";

import { useActionState } from "react";
import { publishJobAction, updateCompanyJobAction } from "@/app/actions/company";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const employmentTypes = [
  ["full_time", "Temps plein"],
  ["part_time", "Temps partiel"],
  ["contract", "Contrat"],
  ["internship", "Stage"],
  ["temporary", "Temporaire"],
];

const educationLevels = [
  ["none", "Aucun diplôme exigé"],
  ["primary", "Primaire"],
  ["secondary", "Collège (BEPC)"],
  ["high_school", "Lycée (BAC)"],
  ["bac_plus_2", "BAC+2 (BTS/DUT)"],
  ["bachelor", "Licence"],
  ["master", "Master"],
  ["doctorate", "Doctorat"],
];

const experienceLevels = [
  ["", "Non précisé"],
  ["internship", "Stage / débutant"],
  ["junior", "Junior"],
  ["mid", "Intermédiaire"],
  ["senior", "Senior"],
  ["executive", "Cadre / direction"],
];

const workplaceTypes = [
  ["onsite", "Sur site"],
  ["hybrid", "Hybride"],
  ["remote", "À distance"],
];

export type JobEditInitial = {
  id: string;
  companyId: string;
  title: string;
  domain: string;
  description: string;
  requirements: string;
  benefits: string;
  city: string;
  countryCode: string;
  workplaceType: "onsite" | "hybrid" | "remote";
  salaryMin: string;
  salaryMax: string;
  employmentType: string;
  minimumEducationLevel: string;
  experienceLevel: string;
  experienceMinYears: string;
  closesAt: string;
};

export function JobPublicationForm({
  companies,
  initial,
}: {
  companies: Array<{ id: string; name: string }>;
  initial?: JobEditInitial;
}) {
  const [state, formAction, pending] = useActionState(
    initial ? updateCompanyJobAction : publishJobAction,
    {},
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Modifier l’offre" : "Informations sur le poste"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {initial ? (
            <>
              <input name="jobId" type="hidden" value={initial.id} />
              <input name="companyId" type="hidden" value={initial.companyId} />
            </>
          ) : companies.length === 1 ? (
            <input name="companyId" type="hidden" value={companies[0].id} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="companyId">Entreprise</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                id="companyId"
                name="companyId"
                required
              >
                <option value="">Sélectionnez une entreprise</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Titre du poste</Label>
            <Input autoComplete="organization-title" defaultValue={initial?.title} id="title" maxLength={180} name="title" placeholder="Ex. Développeur web" required />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="domain">Secteur / domaine</Label>
              <Input defaultValue={initial?.domain} id="domain" maxLength={120} name="domain" placeholder="Ex. Informatique" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workplaceType">Mode de travail</Label>
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={initial?.workplaceType ?? "onsite"} id="workplaceType" name="workplaceType">
                {workplaceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description du poste</Label>
            <Textarea
              defaultValue={initial?.description}
              id="description"
              maxLength={30000}
              minLength={20}
              name="description"
              placeholder="Présentez les missions, les responsabilités et le contexte du poste."
              required
              rows={9}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requirements">Profil recherché (facultatif)</Label>
              <Textarea aria-label="Profil recherché" defaultValue={initial?.requirements} maxLength={12000} name="requirements" rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefits">Avantages (facultatif)</Label>
              <Textarea defaultValue={initial?.benefits} id="benefits" maxLength={8000} name="benefits" rows={4} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input autoComplete="address-level2" defaultValue={initial?.city} id="city" maxLength={120} name="city" placeholder="Ex. Lomé" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countryCode">Pays (code ISO)</Label>
              <Input autoComplete="country" defaultValue={initial?.countryCode ?? "TG"} id="countryCode" maxLength={2} name="countryCode" pattern="[A-Za-z]{2}" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Type de contrat</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={initial?.employmentType ?? ""}
                id="employmentType"
                name="employmentType"
                required
              >
                <option disabled value="">Sélectionnez un contrat</option>
                {employmentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Salaire mensuel (XOF, facultatif)</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Minimum</Label>
                <Input defaultValue={initial?.salaryMin} id="salaryMin" min="0" name="salaryMin" placeholder="Ex. 150000" step="0.01" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Maximum</Label>
                <Input defaultValue={initial?.salaryMax} id="salaryMax" min="0" name="salaryMax" placeholder="Ex. 300000" step="0.01" type="number" />
              </div>
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minimumEducationLevel">Niveau d’étude minimum</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={initial?.minimumEducationLevel ?? ""}
                id="minimumEducationLevel"
                name="minimumEducationLevel"
                required
              >
                <option disabled value="">Sélectionnez un niveau</option>
                {educationLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Niveau d’expérience</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue={initial?.experienceLevel ?? ""}
                id="experienceLevel"
                name="experienceLevel"
              >
                {experienceLevels.map(([value, label]) => <option key={value || "unspecified"} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceMinYears">Années d’expérience minimum (facultatif)</Label>
              <Input defaultValue={initial?.experienceMinYears} id="experienceMinYears" max="80" min="0" name="experienceMinYears" step="0.1" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closesAt">Date limite de candidature</Label>
              <Input defaultValue={initial?.closesAt} id="closesAt" name="closesAt" required type="date" />
            </div>
          </div>

          <AuthFeedback state={state} />
          <Button className="w-full sm:w-auto" disabled={pending} type="submit">
            {pending ? "Enregistrement…" : initial ? "Enregistrer les modifications" : "Publier l’offre"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
