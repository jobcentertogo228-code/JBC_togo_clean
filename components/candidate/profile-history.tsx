"use client";

import { useActionState } from "react";
import {
  deleteCandidateEducationAction,
  deleteCandidateExperienceAction,
  deleteCandidateLanguageAction,
  saveCandidateEducationAction,
  saveCandidateExperienceAction,
  saveCandidateLanguageAction,
  type CandidateActionState,
} from "@/app/actions/candidate";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LanguageProficiency } from "@/types/database";

const languageLevels: Array<[LanguageProficiency, string]> = [
  ["basic", "Notions"],
  ["conversational", "Conversationnel"],
  ["professional", "Professionnel"],
  ["native", "Langue maternelle"],
];

type RemoveAction = (
  state: CandidateActionState,
  formData: FormData,
) => Promise<CandidateActionState>;

function DeleteRecordForm({
  action,
  fieldName,
  id,
}: {
  action: RemoveAction;
  fieldName: string;
  id: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-2">
      <input name={fieldName} type="hidden" value={id} />
      {state.error && <AuthFeedback state={state} />}
      <Button disabled={pending} size="sm" type="submit" variant="ghost">
        {pending ? "Suppression…" : "Supprimer"}
      </Button>
    </form>
  );
}

function LanguageForm({
  language,
}: {
  language?: { id: string; language: string; proficiency: LanguageProficiency };
}) {
  const [state, formAction, pending] = useActionState(saveCandidateLanguageAction, {});
  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      {language && <input name="languageId" type="hidden" value={language.id} />}
      <div className="space-y-1.5">
        <Label htmlFor={language ? `language-${language.id}` : "new-language"}>Langue</Label>
        <Input defaultValue={language?.language ?? ""} id={language ? `language-${language.id}` : "new-language"} maxLength={80} name="language" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={language ? `language-level-${language.id}` : "new-language-level"}>Niveau</Label>
        <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" defaultValue={language?.proficiency ?? "conversational"} id={language ? `language-level-${language.id}` : "new-language-level"} name="proficiency">
          {languageLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <Button disabled={pending} type="submit" variant={language ? "outline" : "default"}>
        {pending ? "Enregistrement…" : language ? "Modifier" : "Ajouter"}
      </Button>
      {language && <DeleteRecordForm action={deleteCandidateLanguageAction} fieldName="languageId" id={language.id} />}
      <div className="sm:col-span-4"><AuthFeedback state={state} /></div>
    </form>
  );
}

function EducationForm({
  education,
}: {
  education?: {
    id: string;
    institution: string;
    qualification: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(saveCandidateEducationAction, {});
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-3">
      {education && <input name="educationId" type="hidden" value={education.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={education ? `institution-${education.id}` : "new-institution"}>Établissement</Label>
          <Input defaultValue={education?.institution ?? ""} id={education ? `institution-${education.id}` : "new-institution"} maxLength={180} name="institution" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={education ? `qualification-${education.id}` : "new-qualification"}>Diplôme</Label>
          <Input defaultValue={education?.qualification ?? ""} id={education ? `qualification-${education.id}` : "new-qualification"} maxLength={180} name="qualification" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={education ? `field-${education.id}` : "new-field"}>Domaine d’étude</Label>
          <Input defaultValue={education?.field_of_study ?? ""} id={education ? `field-${education.id}` : "new-field"} maxLength={180} name="fieldOfStudy" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={education ? `start-year-${education.id}` : "new-start-year"}>Année de début</Label>
            <Input defaultValue={education?.start_date?.slice(0, 4) ?? ""} id={education ? `start-year-${education.id}` : "new-start-year"} max={new Date().getFullYear() + 5} min="1950" name="startYear" type="number" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={education ? `end-year-${education.id}` : "new-end-year"}>Année de fin</Label>
            <Input defaultValue={education?.end_date?.slice(0, 4) ?? ""} id={education ? `end-year-${education.id}` : "new-end-year"} max={new Date().getFullYear() + 5} min="1950" name="endYear" type="number" />
          </div>
        </div>
      </div>
      <Textarea defaultValue={education?.description ?? ""} maxLength={5000} name="description" placeholder="Détails ou distinctions (facultatif)" rows={2} />
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={pending} type="submit" variant={education ? "outline" : "default"}>
          {pending ? "Enregistrement…" : education ? "Modifier la formation" : "Ajouter la formation"}
        </Button>
        {education && <DeleteRecordForm action={deleteCandidateEducationAction} fieldName="educationId" id={education.id} />}
      </div>
      <AuthFeedback state={state} />
    </form>
  );
}

function ExperienceForm({
  experience,
}: {
  experience?: {
    id: string;
    employer: string;
    job_title: string;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    description: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(saveCandidateExperienceAction, {});
  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-3">
      {experience && <input name="experienceId" type="hidden" value={experience.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={experience ? `employer-${experience.id}` : "new-employer"}>Entreprise</Label>
          <Input defaultValue={experience?.employer ?? ""} id={experience ? `employer-${experience.id}` : "new-employer"} maxLength={180} name="employer" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={experience ? `job-title-${experience.id}` : "new-job-title"}>Poste occupé</Label>
          <Input defaultValue={experience?.job_title ?? ""} id={experience ? `job-title-${experience.id}` : "new-job-title"} maxLength={180} name="jobTitle" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={experience ? `start-date-${experience.id}` : "new-start-date"}>Date de début</Label>
          <Input defaultValue={experience?.start_date ?? ""} id={experience ? `start-date-${experience.id}` : "new-start-date"} name="startDate" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={experience ? `end-date-${experience.id}` : "new-end-date"}>Date de fin</Label>
          <Input defaultValue={experience?.end_date ?? ""} disabled={experience?.is_current} id={experience ? `end-date-${experience.id}` : "new-end-date"} name="endDate" type="date" />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input defaultChecked={experience?.is_current} name="isCurrent" type="checkbox" />
        Poste actuel
      </label>
      <Textarea defaultValue={experience?.description ?? ""} maxLength={8000} name="description" placeholder="Missions et réalisations (facultatif)" rows={3} />
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={pending} type="submit" variant={experience ? "outline" : "default"}>
          {pending ? "Enregistrement…" : experience ? "Modifier l’expérience" : "Ajouter l’expérience"}
        </Button>
        {experience && <DeleteRecordForm action={deleteCandidateExperienceAction} fieldName="experienceId" id={experience.id} />}
      </div>
      <AuthFeedback state={state} />
    </form>
  );
}

export function CandidateProfileHistory({
  languages,
  education,
  experiences,
}: {
  languages: Array<{ id: string; language: string; proficiency: LanguageProficiency }>;
  education: NonNullable<Parameters<typeof EducationForm>[0]["education"]>[];
  experiences: NonNullable<Parameters<typeof ExperienceForm>[0]["experience"]>[];
}) {
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Langues</CardTitle>
          <CardDescription>Indiquez les langues que vous maîtrisez et votre niveau.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.map((language) => <LanguageForm key={language.id} language={language} />)}
          <LanguageForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Formations</CardTitle>
          <CardDescription>Ajoutez vos diplômes et parcours de formation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {education.map((item) => <EducationForm education={item} key={item.id} />)}
          <EducationForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expériences professionnelles</CardTitle>
          <CardDescription>Présentez les postes occupés et vos principales missions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {experiences.map((item) => <ExperienceForm experience={item} key={item.id} />)}
          <ExperienceForm />
        </CardContent>
      </Card>
    </div>
  );
}
