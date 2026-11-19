"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookmarkCheck,
  Check,
  ClipboardCheck,
  Copy,
  FileCheck2,
  FileText,
  Mail,
  MessageSquareText,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AssistantTool = "cv" | "letter" | "interview";

const tools: Array<{
  id: AssistantTool;
  title: string;
  description: string;
  icon: typeof FileCheck2;
}> = [
  {
    id: "cv",
    title: "Optimiser mon CV",
    description: "Une checklist pour un CV plus convaincant.",
    icon: FileCheck2,
  },
  {
    id: "letter",
    title: "Lettre de motivation",
    description: "Créer un brouillon adapté au poste visé.",
    icon: Mail,
  },
  {
    id: "interview",
    title: "Préparer mon entretien",
    description: "Réviser les questions et les bons réflexes.",
    icon: MessageSquareText,
  },
];

export function CareerAssistantWidget({
  userName,
  headline,
  summary,
  skills,
  recommendedJobCount,
}: {
  userName: string;
  headline: string | null;
  summary: string | null;
  skills: string[];
  recommendedJobCount: number;
}) {
  const [activeTool, setActiveTool] = useState<AssistantTool | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [letterDraft, setLetterDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);

  function selectTool(tool: AssistantTool) {
    setActiveTool((current) => current === tool ? null : tool);
    setFeedback("");
    setCopied(false);
  }

  function generateLetter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const role = targetRole.trim();
    if (!role) {
      setFeedback("Indiquez le poste visé pour préparer votre brouillon.");
      return;
    }

    const company = companyName.trim() || "votre entreprise";
    const profileLine = headline
      ? `Mon profil de ${headline}${skills.length ? `, avec des compétences en ${skills.slice(0, 3).join(", ")}` : ""}, me motive à rejoindre vos équipes.`
      : `Je souhaite mettre mes compétences${skills.length ? `, notamment ${skills.slice(0, 3).join(", ")}` : ""} au service de vos équipes.`;
    const summaryLine = summary?.trim()
      ? `Mon parcours : ${summary.trim()}`
      : "Je serais heureux de vous présenter plus en détail ma motivation et la valeur que je peux apporter à ce poste.";

    setLetterDraft(
      `Madame, Monsieur,\n\nJe vous adresse ma candidature pour le poste de ${role} au sein de ${company}.\n\n${profileLine}\n\n${summaryLine}\n\nJe serais ravi d’échanger avec vous lors d’un entretien. Je vous remercie pour l’attention portée à ma candidature.\n\nCordialement,\n${userName}`,
    );
    setFeedback("Votre brouillon est prêt. Relisez-le et personnalisez-le avant de l’envoyer.");
    setCopied(false);
  }

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letterDraft);
      setCopied(true);
      setFeedback("Brouillon copié dans le presse-papiers.");
    } catch {
      setCopied(false);
      setFeedback("La copie automatique est indisponible. Sélectionnez le texte pour le copier.");
    }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-5 text-white shadow-lg shadow-indigo-950/15 sm:p-6">
      <div aria-hidden="true" className="absolute -right-10 -top-20 -z-10 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 left-1/3 -z-10 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Assistant Carrière</h2>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-50">
                Espace candidat
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100">
              Des outils pratiques pour avancer sereinement vers votre prochain emploi.
            </p>
          </div>
        </div>
        {activeTool && (
          <button
            aria-label="Fermer l’outil"
            className="absolute right-4 top-4 rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => setActiveTool(null)}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {tools.map(({ id, title, description, icon: Icon }) => (
          <button
            aria-expanded={activeTool === id}
            className={`group flex min-h-24 items-start gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              activeTool === id
                ? "border-white/45 bg-white/20"
                : "border-white/15 bg-white/[0.08] hover:border-white/30 hover:bg-white/[0.14]"
            }`}
            key={id}
            onClick={() => selectTool(id)}
            type="button"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-50">
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-1 block text-xs leading-5 text-blue-100">{description}</span>
            </span>
          </button>
        ))}

        <a
          className="group flex min-h-24 items-start gap-3 rounded-xl border border-white/15 bg-white/[0.08] p-3 text-left text-white transition hover:border-white/30 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          href="#offres-recommandees"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-50">
            <Search aria-hidden="true" className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Emplois adaptés</span>
            <span className="mt-1 block text-xs leading-5 text-blue-100">
              {recommendedJobCount
                ? `${recommendedJobCount} offre${recommendedJobCount > 1 ? "s" : ""} à découvrir selon votre profil.`
                : "Complétez vos compétences pour affiner les recommandations."}
            </span>
          </span>
        </a>
      </div>

      {activeTool && (
        <div
          aria-live="polite"
          className="mt-4 rounded-xl border border-white/20 bg-slate-950/20 p-4 sm:p-5"
          role="region"
        >
          {activeTool === "cv" && (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <h3 className="font-semibold">Checklist express pour votre CV</h3>
                <ul className="mt-3 grid gap-2 text-sm text-blue-50 sm:grid-cols-2">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" /> Un titre adapté au poste visé</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" /> Des résultats concrets et mesurables</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" /> Des compétences pertinentes</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" /> Un CV à jour et facile à lire</li>
                </ul>
              </div>
              <Button asChild className="shrink-0 bg-white text-indigo-800 hover:bg-blue-50">
                <Link href="/candidate/cv">Gérer mes CV <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          )}

          {activeTool === "letter" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div>
                <h3 className="font-semibold">Préparer un brouillon personnalisé</h3>
                <p className="mt-1 text-xs leading-5 text-blue-100">
                  Le modèle reprend les informations de votre profil. Vérifiez chaque phrase avant utilisation.
                </p>
                <form className="mt-4 space-y-3" onSubmit={generateLetter}>
                  <label className="block text-xs font-medium text-blue-50" htmlFor="assistant-target-role">
                    Poste visé
                    <input
                      className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-blue-200 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      id="assistant-target-role"
                      onChange={(event) => setTargetRole(event.target.value)}
                      placeholder="Ex. Chargé de clientèle"
                      value={targetRole}
                    />
                  </label>
                  <label className="block text-xs font-medium text-blue-50" htmlFor="assistant-company-name">
                    Entreprise (facultatif)
                    <input
                      className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-blue-200 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      id="assistant-company-name"
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Nom de l’entreprise"
                      value={companyName}
                    />
                  </label>
                  <Button className="bg-white text-indigo-800 hover:bg-blue-50" type="submit">
                    <FileText className="h-4 w-4" /> Créer le brouillon
                  </Button>
                </form>
              </div>
              <div>
                {letterDraft ? (
                  <>
                    <label className="sr-only" htmlFor="assistant-letter-draft">Brouillon de lettre de motivation</label>
                    <textarea
                      className="min-h-56 w-full resize-y rounded-lg border border-white/20 bg-white/10 p-3 text-sm leading-6 text-white outline-none placeholder:text-blue-200 focus:border-white/50 focus:ring-2 focus:ring-white/20"
                      id="assistant-letter-draft"
                      onChange={(event) => setLetterDraft(event.target.value)}
                      value={letterDraft}
                    />
                    <Button className="mt-2 border-white/25 text-white hover:bg-white/10" onClick={copyLetter} variant="outline">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copié" : "Copier le brouillon"}
                    </Button>
                  </>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-white/25 px-5 text-center text-sm text-blue-100">
                    <Mail aria-hidden="true" className="mb-2 h-5 w-5" />
                    Votre brouillon modifiable apparaîtra ici.
                  </div>
                )}
              </div>
              {feedback && <p className="text-xs text-blue-50 lg:col-span-2" role="status">{feedback}</p>}
            </div>
          )}

          {activeTool === "interview" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div>
                <h3 className="font-semibold">Préparez vos réponses</h3>
                <p className="mt-1 text-xs leading-5 text-blue-100">
                  Entraînez-vous à illustrer chaque réponse avec un exemple précis de votre parcours.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-blue-50">
                  <li className="flex gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" /> Relisez l’offre et renseignez-vous sur l’entreprise.</li>
                  <li className="flex gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" /> Préparez 2 ou 3 exemples concrets de réalisations.</li>
                  <li className="flex gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" /> Préparez une question à poser au recruteur.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Questions pour vous entraîner</p>
                <ol className="mt-3 space-y-3 text-sm">
                  <li><span className="mr-2 text-blue-200">01</span>Présentez-vous et résumez votre parcours.</li>
                  <li><span className="mr-2 text-blue-200">02</span>Pourquoi ce poste{targetRole.trim() ? ` de ${targetRole.trim()}` : ""} vous intéresse-t-il ?</li>
                  <li><span className="mr-2 text-blue-200">03</span>Parlez d’un défi professionnel que vous avez surmonté.</li>
                  <li><span className="mr-2 text-blue-200">04</span>Qu’aimeriez-vous accomplir dans les premiers mois ?</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {!activeTool && (
        <p className="mt-4 flex items-center gap-2 text-xs text-blue-100">
          <BookmarkCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Vos recommandations utilisent les compétences renseignées dans votre profil.
        </p>
      )}

      {activeTool === "cv" && feedback && <p className="sr-only" role="status">{feedback}</p>}
    </section>
  );
}
