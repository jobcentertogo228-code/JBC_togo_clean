"use client";

import { useActionState, useState } from "react";
import { saveCandidateSkillsAction } from "@/app/actions/candidate";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function CandidateSkillsForm({
  skills,
  selectedSkills,
}: {
  skills: Array<{ id: string; name: string; category: string | null }>;
  selectedSkills: Array<{ skill_id: string; proficiency: number | null }>;
}) {
  const [state, formAction, pending] = useActionState(saveCandidateSkillsAction, {});
  const [selectedIds, setSelectedIds] = useState(() => new Set(selectedSkills.map((skill) => skill.skill_id)));
  const [proficiencies, setProficiencies] = useState(
    () => Object.fromEntries(selectedSkills.map((skill) => [skill.skill_id, String(skill.proficiency ?? 3)])),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compétences</CardTitle>
        <CardDescription>Sélectionnez jusqu’à 30 compétences qui représentent votre profil.</CardDescription>
      </CardHeader>
      <CardContent>
        {skills.length ? (
          <form action={formAction} className="space-y-5">
            <fieldset>
              <legend className="sr-only">Choisir mes compétences</legend>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Label
                    className="cursor-pointer"
                    key={skill.id}
                  >
                    <input
                      className="peer sr-only"
                      checked={selectedIds.has(skill.id)}
                      name="skillIds"
                      onChange={(event) => {
                        setSelectedIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(skill.id);
                          else next.delete(skill.id);
                          return next;
                        });
                      }}
                      type="checkbox"
                      value={skill.id}
                    />
                    <span className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                      {skill.name}
                    </span>
                  </Label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {skills.filter((skill) => selectedIds.has(skill.id)).map((skill) => (
                <div className="space-y-1.5" key={skill.id}>
                  <Label htmlFor={`proficiency-${skill.id}`}>{skill.name} — niveau</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    id={`proficiency-${skill.id}`}
                    name="skillProficiencies"
                    onChange={(event) => setProficiencies((current) => ({ ...current, [skill.id]: event.target.value }))}
                    value={`${skill.id}:${proficiencies[skill.id] ?? "3"}`}
                  >
                    {[
                      ["1", "Débutant"],
                      ["2", "Élémentaire"],
                      ["3", "Intermédiaire"],
                      ["4", "Avancé"],
                      ["5", "Expert"],
                    ].map(([value, label]) => (
                      <option key={value} value={`${skill.id}:${value}`}>{label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <AuthFeedback state={state} />
            <Button disabled={pending} type="submit">{pending ? "Enregistrement…" : "Enregistrer mes compétences"}</Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Le catalogue de compétences sera bientôt disponible.</p>
        )}
      </CardContent>
    </Card>
  );
}
