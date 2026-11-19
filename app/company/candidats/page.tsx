import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, MapPin, Search, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/lib/auth/roles";
import { getCandidateAvatarUrl } from "@/lib/candidate/avatar";

export const metadata: Metadata = {
  title: "Rechercher des candidats",
  description: "Recherchez des profils candidats visibles par votre entreprise.",
};

const pageSize = 20;

export default async function CompanyCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; skill?: string; page?: string }>;
}) {
  const params = await searchParams;
  const queryText = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const city = typeof params.city === "string" ? params.city.trim().slice(0, 100) : "";
  const skill = typeof params.skill === "string" ? params.skill.trim().slice(0, 80) : "";
  const pageNumber = Number(params.page);
  const page = Number.isSafeInteger(pageNumber) && pageNumber > 0 && pageNumber <= 10000 ? pageNumber : 1;
  const { supabase } = await requireRole("company");

  let candidateIds: string[] | null = null;
  if (skill) {
    const { data: matchingSkills, error: skillError } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", `%${skill}%`)
      .limit(50);
    if (skillError) throw new Error(`Impossible de rechercher cette compétence : ${skillError.message}`);
    const skillIds = (matchingSkills ?? []).map((item) => item.id);
    if (skillIds.length) {
      const { data: candidatesWithSkill, error } = await supabase
        .from("candidate_skills")
        .select("candidate_id")
        .in("skill_id", skillIds)
        .limit(5000);
      if (error) throw new Error(`Impossible de filtrer par compétence : ${error.message}`);
      candidateIds = [...new Set((candidatesWithSkill ?? []).map((item) => item.candidate_id))];
    } else {
      candidateIds = [];
    }
  }

  let candidatesQuery = supabase
    .from("candidates")
    .select("profile_id, candidate_code, first_name, last_name, display_name, photo_url, headline, summary, city, country_code, years_experience, availability, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false });
  if (queryText) candidatesQuery = candidatesQuery.textSearch("search_document", queryText, { config: "simple", type: "websearch" });
  if (city) candidatesQuery = candidatesQuery.ilike("city", `%${city}%`);
  if (candidateIds !== null) candidatesQuery = candidatesQuery.in("profile_id", candidateIds);

  const [{ data: candidates, count, error: candidatesError }, skillCatalogResult] = await Promise.all([
    candidateIds?.length === 0
      ? Promise.resolve({ data: [], count: 0, error: null })
      : candidatesQuery.range((page - 1) * pageSize, page * pageSize - 1),
    supabase.from("skills").select("id, name").order("name").limit(500),
  ]);
  if (candidatesError) throw new Error(`Impossible de charger les profils candidats : ${candidatesError.message}`);
  if (skillCatalogResult.error) throw new Error(`Impossible de charger le catalogue de compétences : ${skillCatalogResult.error.message}`);

  const rows = candidates ?? [];
  const profileIds = rows.map((candidate) => candidate.profile_id);
  const [{ data: selectedSkills, error: selectedSkillsError }, { data: resumes, error: resumesError }] = await Promise.all([
    profileIds.length
      ? supabase.from("candidate_skills").select("candidate_id, skill_id").in("candidate_id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? supabase.from("resumes").select("id, candidate_id").in("candidate_id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (selectedSkillsError) throw new Error(`Impossible de charger les compétences des candidats : ${selectedSkillsError.message}`);
  if (resumesError) throw new Error(`Impossible de vérifier les CV disponibles : ${resumesError.message}`);

  const skillNameById = new Map((skillCatalogResult.data ?? []).map((item) => [item.id, item.name]));
  const skillsByCandidate = new Map<string, string[]>();
  (selectedSkills ?? []).forEach((item) => {
    const values = skillsByCandidate.get(item.candidate_id) ?? [];
    const name = skillNameById.get(item.skill_id);
    if (name) values.push(name);
    skillsByCandidate.set(item.candidate_id, values);
  });
  const candidatesWithResume = new Set((resumes ?? []).map((resume) => resume.candidate_id));
  const avatarEntries = await Promise.all(rows.map(async (candidate) => [
    candidate.profile_id,
    await getCandidateAvatarUrl(supabase, candidate.profile_id, candidate.photo_url),
  ] as const));
  const avatarByCandidate = new Map(avatarEntries);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Espace entreprise</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Recherche de candidats</h1>
        <p className="mt-2 text-muted-foreground">Explorez les profils partagés avec les recruteurs de votre entreprise.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form action="/company/candidats" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="q">Métier ou mots-clés</Label>
              <Input defaultValue={queryText} id="q" maxLength={100} name="q" placeholder="Ex. comptable, gestion…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ville</Label>
              <Input defaultValue={city} id="city" maxLength={100} name="city" placeholder="Ex. Lomé" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skill">Compétence</Label>
              <Input defaultValue={skill} id="skill" maxLength={80} name="skill" placeholder="Ex. Excel" />
            </div>
            <Button className="self-end" type="submit"><Search aria-hidden="true" className="h-4 w-4" />Rechercher</Button>
          </form>
        </CardContent>
      </Card>

      <section aria-label="Résultats de recherche">
        <p className="mb-3 text-sm text-muted-foreground">{total} profil{total === 1 ? "" : "s"} visible{total === 1 ? "" : "s"}</p>
        {rows.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((candidate) => {
              const name = candidate.display_name
                || [candidate.first_name, candidate.last_name].filter(Boolean).join(" ")
                || "Candidat";
              const skills = (skillsByCandidate.get(candidate.profile_id) ?? []).slice(0, 5);
              return (
                <Card key={candidate.profile_id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12" imageUrl={avatarByCandidate.get(candidate.profile_id)} name={name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="truncate">{name}</CardTitle>
                          {candidatesWithResume.has(candidate.profile_id) && <Badge variant="success"><FileText aria-hidden="true" className="mr-1 h-3 w-3" />CV partagé</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{candidate.candidate_code}</p>
                        {candidate.headline && <p className="mt-2 text-sm font-medium text-primary">{candidate.headline}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {candidate.city && <span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="h-3.5 w-3.5" />{candidate.city}, {candidate.country_code.trim()}</span>}
                      {candidate.years_experience !== null && <span>{candidate.years_experience} an{candidate.years_experience > 1 ? "s" : ""} d’expérience</span>}
                    </div>
                    {candidate.summary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{candidate.summary}</p>}
                    {skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{skills.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div>}
                    <Button asChild className="mt-4" size="sm" variant="outline">
                      <Link href={`/company/candidats/${candidate.profile_id}`}><UserRound aria-hidden="true" className="h-4 w-4" />Voir le profil</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Aucun profil visible ne correspond à ces critères.</CardContent></Card>
        )}
      </section>

      {total > pageSize && (
        <nav aria-label="Pagination des candidats" className="flex items-center justify-between">
          {page > 1
            ? <Button asChild variant="outline"><Link href={pageHref({ queryText, city, skill, page: page - 1 })}><ChevronLeft aria-hidden="true" className="h-4 w-4" />Précédent</Link></Button>
            : <span />}
          <span className="text-sm text-muted-foreground">Page {page} sur {totalPages}</span>
          {page < totalPages
            ? <Button asChild variant="outline"><Link href={pageHref({ queryText, city, skill, page: page + 1 })}>Suivant<ChevronRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
            : <span />}
        </nav>
      )}
    </div>
  );
}

function pageHref({
  queryText,
  city,
  skill,
  page,
}: {
  queryText: string;
  city: string;
  skill: string;
  page: number;
}) {
  const params = new URLSearchParams({ page: page.toString() });
  if (queryText) params.set("q", queryText);
  if (city) params.set("city", city);
  if (skill) params.set("skill", skill);
  return `/company/candidats?${params}`;
}
