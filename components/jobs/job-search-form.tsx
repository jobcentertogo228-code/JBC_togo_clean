import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobSearchFilters } from "@/lib/jobs/queries";

const contracts = [
  ["full_time", "Temps plein"],
  ["part_time", "Temps partiel"],
  ["contract", "Contrat"],
  ["internship", "Stage"],
  ["temporary", "Temporaire"],
];

const experienceLevels = [
  ["internship", "Stage / débutant"],
  ["junior", "Junior"],
  ["mid", "Intermédiaire"],
  ["senior", "Senior"],
  ["executive", "Direction"],
];

const salaryRanges = [
  ["50000", "50 000 XOF et plus"],
  ["100000", "100 000 XOF et plus"],
  ["250000", "250 000 XOF et plus"],
  ["500000", "500 000 XOF et plus"],
  ["1000000", "1 000 000 XOF et plus"],
];

export function JobSearchForm({
  filters,
  domains,
}: {
  filters: JobSearchFilters;
  domains: string[];
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <form action="/emplois" className="space-y-4" method="get">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(200px,1fr)_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="q">Métier ou mot-clé</Label>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  defaultValue={filters.q}
                  id="q"
                  name="q"
                  placeholder="Ex. comptable, développeur…"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ville</Label>
              <Input defaultValue={filters.city} id="city" name="city" placeholder="Lomé, Kara…" />
            </div>
            <Button className="self-end" size="lg" type="submit">
              <Search aria-hidden="true" className="h-4 w-4" />Rechercher
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="domain">Domaine</Label>
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={filters.domain} id="domain" name="domain">
                <option value="">Tous les domaines</option>
                {filters.domain && !domains.includes(filters.domain) && (
                  <option value={filters.domain}>{filters.domain}</option>
                )}
                {domains.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contract">Type de contrat</Label>
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={filters.contract} id="contract" name="contract">
                <option value="">Tous les contrats</option>
                {contracts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minSalary">Salaire minimum</Label>
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={filters.minSalary?.toString() ?? ""} id="minSalary" name="minSalary">
                <option value="">Sans minimum</option>
                {salaryRanges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                {filters.minSalary && !salaryRanges.some(([value]) => Number(value) === filters.minSalary) && (
                  <option value={filters.minSalary}>{new Intl.NumberFormat("fr-TG").format(filters.minSalary)} XOF et plus</option>
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience">Expérience</Label>
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={filters.experience} id="experience" name="experience">
                <option value="">Tous les niveaux</option>
                {experienceLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postedWithin">Date de publication</Label>
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={filters.postedWithin} id="postedWithin" name="postedWithin">
                <option value="">Toutes les dates</option>
                <option value="day">Dernières 24 heures</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ces 30 derniers jours</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort">Trier par</Label>
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" defaultValue={filters.sort} id="sort" name="sort">
                <option value="newest">Plus récentes</option>
                <option value="salary_desc">Salaire décroissant</option>
                <option value="salary_asc">Salaire croissant</option>
              </select>
            </div>
          </div>
          <input name="page" type="hidden" value="1" />
        </form>
      </CardContent>
    </Card>
  );
}
