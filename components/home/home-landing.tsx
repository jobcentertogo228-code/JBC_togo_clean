"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe2,
  HeartHandshake,
  Layers3,
  LockKeyhole,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Smartphone,
  UsersRound,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { JobCenterBrand } from "@/components/brand/job-center-brand";

const stats = [
  { value: "500+", label: "offres d’emploi", icon: BriefcaseBusiness },
  { value: "250+", label: "entreprises", icon: Building2 },
  { value: "5 000+", label: "talents", icon: UsersRound },
  { value: "1 000+", label: "recrutements", icon: HeartHandshake },
];

const steps = [
  {
    number: "01",
    title: "Créez votre profil",
    text: "Présentez votre parcours, vos compétences et vos ambitions en quelques minutes.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Trouvez les bonnes offres",
    text: "Explorez des opportunités adaptées à votre métier, votre ville et vos envies.",
    icon: Search,
  },
  {
    number: "03",
    title: "Postulez en un clic",
    text: "Votre profil et votre CV vous accompagnent, sans recommencer à chaque candidature.",
    icon: Zap,
  },
  {
    number: "04",
    title: "Faites grandir votre carrière",
    text: "Suivez vos candidatures et avancez avec confiance vers votre prochain défi.",
    icon: ArrowUpRight,
  },
];

const candidateBenefits = [
  "Un CV professionnel au même endroit",
  "Des alertes sur les nouvelles opportunités",
  "Une candidature rapide et simplifiée",
  "Un tableau de bord pour suivre votre parcours",
];

const companyBenefits = [
  "Publiez vos offres en quelques étapes",
  "Explorez une base de profils qualifiés",
  "Centralisez et suivez les candidatures",
  "Pilotez vos recrutements avec des statistiques",
];

const advantages = [
  {
    title: "Un recrutement plus intelligent",
    text: "Des outils utiles pour rapprocher compétences, ambitions et besoins réels.",
    icon: Sparkles,
    tone: "blue",
  },
  {
    title: "Des profils mieux valorisés",
    text: "Des parcours, des compétences et des expériences présentés clairement.",
    icon: UsersRound,
    tone: "gold",
  },
  {
    title: "Une plateforme sécurisée",
    text: "Vos espaces et vos informations sont protégés par des accès adaptés.",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    title: "Une expérience moderne",
    text: "Un parcours simple et agréable, pensé pour aller à l’essentiel.",
    icon: Layers3,
    tone: "violet",
  },
  {
    title: "Des notifications en temps réel",
    text: "Restez informé des candidatures et des évolutions importantes.",
    icon: BellRing,
    tone: "orange",
  },
  {
    title: "Web et mobile",
    text: "Accédez à votre espace où que vous soyez, sur ordinateur ou téléphone.",
    icon: Smartphone,
    tone: "cyan",
  },
];

const partners = ["KÉLÉGBÉ", "NUNYA", "AFI TECH", "KORA", "HORIZON", "YOVO"];

const testimonials = [
  {
    quote:
      "J’ai pu présenter mon parcours autrement et suivre mes candidatures sans me perdre dans les messages.",
    name: "Afi K.",
    role: "Candidate en gestion",
    initials: "AK",
    color: "from-rose-400 to-orange-300",
  },
  {
    quote:
      "Pour une PME, chaque heure compte. Nous avons enfin un espace clair pour publier et organiser nos recrutements.",
    name: "Kossi A.",
    role: "Dirigeant de PME",
    initials: "KA",
    color: "from-emerald-500 to-teal-300",
  },
  {
    quote:
      "L’équipe RH garde une meilleure visibilité sur les candidatures et peut se concentrer sur les échanges humains.",
    name: "Ama D.",
    role: "Responsable RH",
    initials: "AD",
    color: "from-violet-500 to-fuchsia-300",
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.16 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <JobCenterBrand inverse={inverse} />;
}

function SectionHeading({
  eyebrow,
  title,
  text,
  light = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  light?: boolean;
}) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${light ? "text-white" : ""}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-blue-200" : "text-blue-700 dark:text-blue-300"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] ${light ? "text-white" : "text-slate-950 dark:text-white"}`}>
        {title}
      </h2>
      {text && (
        <p className={`mx-auto mt-4 max-w-xl text-base leading-7 ${light ? "text-blue-100/75" : "text-slate-600 dark:text-slate-300"}`}>
          {text}
        </p>
      )}
    </div>
  );
}

function PrimaryLink({
  href,
  children,
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 ${
        light
          ? "bg-white text-slate-950 shadow-lg shadow-blue-950/20 hover:-translate-y-0.5 hover:bg-blue-50"
          : "bg-blue-600 text-white shadow-lg shadow-blue-700/20 hover:-translate-y-0.5 hover:bg-blue-700"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

function Portrait({
  className,
  skin,
  shirt,
}: {
  className?: string;
  skin: string;
  shirt: string;
}) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-lg ${className ?? ""}`} aria-hidden="true">
      <div className={`absolute inset-0 ${shirt}`} />
      <svg className="relative mt-2 h-full w-full" viewBox="0 0 100 100" fill="none">
        <path d="M17 100c2-24 13-36 33-36s31 12 33 36" fill={shirt.includes("amber") ? "#FBBF24" : shirt.includes("emerald") ? "#10B981" : "#2563EB"} />
        <path d="M31 41c0-17 8-27 20-27 13 0 20 10 20 27v8c0 14-9 24-20 24S31 63 31 49v-8Z" fill={skin} />
        <path d="M29 40c0-22 8-33 23-33 13 0 22 9 22 27-4-7-10-12-19-14-6 7-14 11-26 12v8Z" fill="#172033" />
        <circle cx="42" cy="45" r="1.8" fill="#172033" />
        <circle cx="59" cy="45" r="1.8" fill="#172033" />
        <path d="M45 56c3 2 7 2 10 0" stroke="#8A4B3A" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function HeroArtwork() {
  const reduceMotion = useReducedMotion();
  return (
    <div aria-label="Illustration d’un réseau de talents et d’entreprises" className="relative mx-auto aspect-[1.05/1] w-full max-w-[590px] md:aspect-[1.1/1]" role="img">
      <div className="absolute inset-[8%] rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-sm" />
      <div className="absolute left-[12%] top-[12%] h-28 w-28 rounded-full bg-blue-500/25 blur-3xl" />
      <div className="absolute bottom-[11%] right-[8%] h-36 w-36 rounded-full bg-[#D4AF37]/20 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 520" fill="none" aria-hidden="true">
        <path d="M133 174 276 260 423 157M134 174l5 178 137-92 148 107-1-190M139 352l285-195" stroke="white" strokeOpacity=".22" strokeDasharray="5 8" />
        <circle cx="133" cy="174" r="6" fill="#D4AF37" />
        <circle cx="276" cy="260" r="7" fill="#60A5FA" />
        <circle cx="423" cy="157" r="6" fill="#D4AF37" />
        <circle cx="139" cy="352" r="5" fill="#60A5FA" />
        <circle cx="424" cy="453" r="5" fill="#60A5FA" />
      </svg>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        className="absolute left-[5%] top-[20%] hidden items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/80 p-3 shadow-2xl backdrop-blur-xl sm:flex"
        transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200"><Building2 className="h-5 w-5" /></span>
        <span><span className="block text-xs font-bold text-white">Une équipe qui grandit</span><span className="mt-1 block text-[10px] text-blue-100/60">Togo · Recrutement</span></span>
      </motion.div>

      <div className="absolute left-[15%] top-[37%] h-28 w-28 sm:left-[17%] sm:top-[32%] sm:h-32 sm:w-32">
        <Portrait className="h-full w-full" shirt="bg-gradient-to-br from-amber-100 to-orange-200" skin="#8B4F38" />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-slate-900 px-2.5 py-1 text-[9px] font-semibold text-white">Talent</span>
      </div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
        className="absolute right-[5%] top-[30%] rounded-2xl border border-white/15 bg-white p-3 text-slate-900 shadow-2xl shadow-black/30 sm:right-[4%] sm:top-[24%] sm:p-4"
        transition={reduceMotion ? undefined : { duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Sparkles className="h-4 w-4" /></span>
          <span><span className="block text-[10px] font-bold text-slate-950">Matching intelligent</span><span className="mt-0.5 block text-[9px] text-slate-500">Exemple d’expérience</span></span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" /></div>
          <span className="text-[10px] font-extrabold text-blue-700">86%</span>
        </div>
      </motion.div>

      <div className="absolute bottom-[17%] left-[5%] rounded-2xl border border-white/10 bg-slate-900/85 p-3.5 shadow-2xl backdrop-blur-xl sm:bottom-[15%] sm:left-[4%] sm:p-4">
        <p className="text-[10px] font-semibold text-blue-100/60">Opportunité repérée</p>
        <p className="mt-1.5 text-xs font-bold text-white sm:text-sm">Chargé·e de projets</p>
        <div className="mt-2 flex items-center gap-1.5 text-[9px] text-blue-100/65"><Building2 className="h-3 w-3" /> Entreprise locale <span className="mx-1 h-1 w-1 rounded-full bg-[#D4AF37]" /> Lomé</div>
      </div>

      <div className="absolute bottom-[12%] right-[9%] h-28 w-28 sm:bottom-[9%] sm:right-[15%] sm:h-32 sm:w-32">
        <Portrait className="h-full w-full" skin="#6C3D2F" shirt="bg-gradient-to-br from-emerald-100 to-teal-200" />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-slate-900 px-2.5 py-1 text-[9px] font-semibold text-white">Entreprise</span>
      </div>

      <motion.div
        animate={reduceMotion ? undefined : { rotate: [0, 5, 0], y: [0, -5, 0] }}
        className="absolute left-[43%] top-[47%] flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37] text-slate-950 shadow-xl shadow-amber-500/20 sm:h-[4.5rem] sm:w-[4.5rem]"
        transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Workflow aria-hidden="true" className="h-7 w-7 sm:h-8 sm:w-8" />
      </motion.div>

      <div className="absolute right-[4%] top-[6%] flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[9px] font-medium text-blue-100/75 backdrop-blur sm:right-[8%] sm:top-[8%] sm:text-[10px]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Talents & entreprises en mouvement
      </div>
    </div>
  );
}

function AppMockup() {
  const reduceMotion = useReducedMotion();
  return (
    <div aria-label="Maquette illustrative de l’application mobile JOB-CENTER" className="relative mx-auto w-[min(100%,290px)]" role="img">
      <div className="rounded-[2.7rem] border-[7px] border-slate-900 bg-slate-900 p-2 shadow-[0_35px_80px_-25px_rgba(15,23,42,0.5)] dark:border-slate-700">
        <div className="overflow-hidden rounded-[2rem] bg-slate-50">
          <div className="relative h-[490px] overflow-hidden px-4 pb-4 pt-7">
            <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
            <div className="flex items-center justify-between pt-2">
              <span className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-tight text-slate-950">
                <Image alt="JOB CENTER Logo" className="h-7 w-7 object-contain" height={28} src="/brand/job-center-mark.svg" width={28} />
                JOB-CENTER
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700"><BellRing className="h-4 w-4" /></span>
            </div>
            <p className="mt-7 text-xs font-semibold text-slate-500">BONJOUR, AFI 👋</p>
            <h3 className="mt-1 text-xl font-bold leading-tight text-slate-950">Votre prochain défi vous attend.</h3>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-400 shadow-sm"><Search className="h-4 w-4" />Métier, entreprise…</div>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-950">Pour vous</p>
              <span className="text-[10px] font-semibold text-blue-700">Tout voir</span>
            </div>
            <div className="mt-3 space-y-3">
              {[
                ["Assistante de gestion", "Entreprise locale · Lomé", "Temps plein"],
                ["Chargé·e de communication", "Studio créatif · Lomé", "Hybride"],
              ].map(([title, company, type]) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm" key={title}>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><BriefcaseBusiness className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-950">{title}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{company}</p>
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">{type}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-slate-200 bg-white px-3 py-3 text-slate-400">
              <BriefcaseBusiness className="h-4 w-4 text-blue-600" /><Search className="h-4 w-4" /><FileText className="h-4 w-4" /><UsersRound className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      <motion.div
        animate={reduceMotion ? undefined : { x: [0, 5, 0] }}
        className="absolute -right-7 top-[24%] hidden max-w-[180px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:flex dark:border-slate-700 dark:bg-slate-800"
        transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><BellRing className="h-4 w-4" /></span>
        <span><span className="block text-[10px] font-bold text-slate-900 dark:text-white">Nouvelle opportunité</span><span className="mt-1 block text-[9px] text-slate-500 dark:text-slate-300">Une offre correspond à votre profil</span></span>
      </motion.div>
    </div>
  );
}

export function HomeLanding() {
  const reduceMotion = useReducedMotion();
  return (
    <main className="overflow-hidden bg-[#F8FAFC] text-[#0F172A] dark:bg-slate-950 dark:text-slate-100">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-slate-950 focus:shadow-xl" href="#contenu">
        Aller au contenu principal
      </a>

      <div className="bg-[#0F172A] px-4 py-2 text-center text-[11px] font-medium text-blue-100/80 sm:text-xs">
        Pensé au Togo, ouvert à toutes les ambitions <span className="mx-1.5 text-[#D4AF37]">✦</span> Candidats et entreprises, votre prochaine étape commence ici
      </div>

      <header className="relative z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
            <Link className="text-sm font-semibold text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-white" href="/emplois">Offres d’emploi</Link>
            <a className="text-sm font-semibold text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-white" href="#candidats">Candidats</a>
            <a className="text-sm font-semibold text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-white" href="#entreprises">Entreprises</a>
            <a className="text-sm font-semibold text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-white" href="#fonctionnement">Comment ça marche</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:text-blue-700 dark:text-slate-200" href="/connexion">Connexion</Link>
            <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] dark:bg-white dark:text-slate-950 dark:hover:bg-blue-50" href="/inscription">
              Créer un compte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <details className="group relative md:hidden">
            <summary aria-label="Ouvrir le menu de navigation" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 text-slate-800 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-white/15 dark:text-white">
              <Menu aria-hidden="true" className="h-5 w-5 group-open:hidden" />
              <X aria-hidden="true" className="hidden h-5 w-5 group-open:block" />
            </summary>
            <nav aria-label="Navigation mobile" className="absolute right-0 top-12 z-50 grid w-[min(85vw,320px)] gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <Link className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" href="/emplois">Offres d’emploi</Link>
              <a className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" href="#candidats">Candidats</a>
              <a className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" href="#entreprises">Entreprises</a>
              <a className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" href="#fonctionnement">Comment ça marche</a>
              <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
              <Link className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" href="/connexion">Connexion</Link>
              <Link className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-bold text-white" href="/inscription">Créer un compte</Link>
            </nav>
          </details>
        </div>
      </header>

      <div id="contenu">
        <section className="relative isolate overflow-hidden bg-[#0F172A] text-white">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_40%,rgba(37,99,235,0.3),transparent_44%),radial-gradient(ellipse_at_12%_100%,rgba(212,175,55,0.12),transparent_35%)]" />
          <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-2 px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-0 lg:px-8 lg:pb-24 lg:pt-24">
            <Reveal className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-blue-100/90 backdrop-blur">
                <Globe2 aria-hidden="true" className="h-3.5 w-3.5 text-[#D4AF37]" /> Une nouvelle dynamique pour l’emploi au Togo
              </div>
              <h1 className="mt-6 max-w-[700px] text-[2.65rem] font-bold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-[4.2rem]">
                La première plateforme de recrutement <span className="bg-gradient-to-r from-blue-300 via-white to-[#E8CC74] bg-clip-text text-transparent">intelligente au Togo</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-blue-100/75 sm:text-lg sm:leading-8">
                Connectez les meilleurs talents aux meilleures opportunités grâce à une plateforme moderne pensée pour les entreprises et les candidats africains.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/emplois" light> Trouver un emploi <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" /></PrimaryLink>
                <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/inscription/entreprise">
                  Recruter maintenant <Building2 aria-hidden="true" className="h-4 w-4 text-[#D4AF37]" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-blue-100/65">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Espaces protégés</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D4AF37]" /> Conçu pour le Togo</span>
                <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-blue-300" /> Web & mobile</span>
              </div>
            </Reveal>
            <Reveal className="relative -mx-4 mt-2 sm:mx-0 lg:mt-0" delay={0.12}>
              <HeroArtwork />
            </Reveal>
          </div>
          <a aria-label="Découvrir JOB-CENTER" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 transition hover:text-white/80 lg:flex" href="#chiffres">
            Découvrir <ArrowDown className="h-3 w-3" />
          </a>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
        </section>

        <section aria-labelledby="chiffres-title" className="relative z-10 mx-auto -mt-1 max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8" id="chiffres">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Une ambition collective</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl" id="chiffres-title">Le talent togolais mérite de rayonner.</h2>
            </div>
            <span className="rounded-full border border-[#D4AF37]/40 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">Repères de démonstration</span>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-4">
            {stats.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal className={`relative p-5 sm:p-7 ${index % 2 ? "border-l border-slate-200 dark:border-slate-800" : ""} ${index > 1 ? "border-t border-slate-200 dark:border-slate-800 sm:border-t-0" : ""} ${index === 2 ? "sm:border-l" : ""}`} delay={index * 0.05} key={item.label}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">{item.value}</p>
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{item.label}</p>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-2 text-right text-[10px] text-slate-400 dark:text-slate-500">Chiffres illustratifs, à remplacer par les données Supabase.</p>
        </section>

        <section className="border-y border-slate-200/70 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40 sm:py-24" id="fonctionnement">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Simple, humain, efficace" title="Comment ça marche ?" text="Un parcours clair pour transformer une intention en nouvelle opportunité." /></Reveal>
            <div className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
              <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-blue-200 via-[#D4AF37] to-blue-200 dark:from-blue-900 dark:via-amber-500/40 dark:to-blue-900 lg:block" />
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal className="relative" delay={index * 0.08} key={step.number}>
                    <article className="group h-full rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-slate-800/80 sm:p-6">
                      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-sm transition group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300">
                        <Icon aria-hidden="true" className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-[11px] font-extrabold tracking-[0.16em] text-[#D4AF37]">ÉTAPE {step.number}</p>
                      <h3 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24" id="candidats">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-800 to-[#0F172A] p-6 text-white shadow-2xl shadow-blue-950/15 sm:p-9">
                <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full border border-white/10" />
                <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full border border-[#D4AF37]/35" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-blue-100"><UsersRound className="h-3.5 w-3.5" /> ESPACE CANDIDAT</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-slate-950"><Sparkles className="h-5 w-5" /></span>
                  </div>
                  <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <Portrait className="h-12 w-12 border-2" skin="#8B4F38" shirt="bg-gradient-to-br from-amber-100 to-orange-200" />
                      <div><p className="text-sm font-bold">Profil professionnel</p><p className="mt-0.5 text-[10px] text-blue-100/65">Votre parcours, à votre image</p></div>
                      <span className="ml-auto rounded-lg bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-200">82 %</span>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-200" /></div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {["Compétences", "Expériences", "CV"].map((item) => <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center text-[9px] font-medium text-blue-100/75" key={item}>{item}</span>)}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3"><p className="text-[9px] font-semibold text-blue-100/55">CANDIDATURES</p><p className="mt-1 text-lg font-bold">Suivies</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3"><p className="text-[9px] font-semibold text-blue-100/55">OPPORTUNITÉS</p><p className="mt-1 text-lg font-bold">Pertinentes</p></div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Pour les candidats</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Développez votre carrière, à votre rythme.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
                Votre potentiel mérite d’être vu. Créez un profil vivant, découvrez des postes qui vous correspondent et gardez la maîtrise de chaque étape.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {candidateBenefits.map((item) => <li className="flex items-start gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200" key={item}><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"><Check className="h-3 w-3" /></span>{item}</li>)}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/inscription/candidat">Créer mon profil <ArrowRight className="h-4 w-4" /></PrimaryLink>
                <Link className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/50" href="/emplois">Explorer les offres <ChevronRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40 sm:py-24" id="entreprises">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
            <Reveal className="order-2 lg:order-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Pour les entreprises</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Recrutez les meilleurs talents.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
                Des premiers besoins jusqu’à la sélection, gérez votre recrutement dans un espace clair et centralisé, conçu pour les organisations qui font avancer le Togo.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {companyBenefits.map((item) => <li className="flex items-start gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200" key={item}><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-200"><Check className="h-3 w-3" /></span>{item}</li>)}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryLink href="/inscription/entreprise">Ouvrir un espace entreprise <ArrowRight className="h-4 w-4" /></PrimaryLink>
              </div>
            </Reveal>
            <Reveal className="order-1 lg:order-2" delay={0.1}>
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[#F8FAFC] p-5 shadow-xl shadow-slate-950/5 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-600/10" />
                <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tableau de recrutement</p><h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Votre équipe, en mouvement</h3></div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Vue synthétique</span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[["Offres", "Actives"], ["Candidats", "À découvrir"], ["Entretiens", "À organiser"]].map(([label, value], i) => <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900" key={label}><p className="text-[9px] font-medium text-slate-500">{label}</p><p className={`mt-1 text-xs font-bold ${i === 1 ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-100"}`}>{value}</p></div>)}
                  </div>
                  <div className="mt-5 flex items-end gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-white p-4 dark:from-blue-950/40 dark:to-slate-800">
                    {[35, 54, 42, 72, 58, 88, 68, 96, 76, 100].map((height, index) => <div className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-700 to-cyan-400 opacity-90" key={`${height}-${index}`} style={{ height: `${height}px` }} />)}
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {["Chargé·e de communication", "Assistant·e comptable", "Responsable des opérations"].map((job, index) => (
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0 dark:border-slate-700" key={job}>
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${index === 1 ? "bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200" : "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200"}`}><BriefcaseBusiness className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{job}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{index + 4} profils</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="relative mt-3 text-center text-[10px] text-slate-400">Illustration d’un tableau de bord de recrutement</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="L’essentiel, avec intention" title="Pourquoi choisir JOB-CENTER ?" text="Une technologie au service des rencontres professionnelles, avec une expérience qui reste profondément humaine." /></Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {advantages.map((item, index) => {
                const Icon = item.icon;
                const tones: Record<string, string> = {
                  blue: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
                  gold: "bg-amber-50 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200",
                  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
                  violet: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
                  orange: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300",
                  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300",
                };
                return (
                  <Reveal delay={index * 0.045} key={item.title}>
                    <article className="group h-full rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-6">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105 ${tones[item.tone]}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
                      <h3 className="mt-5 text-base font-bold text-slate-950 dark:text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/40 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
                <div className="max-w-md">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Un écosystème qui avance</p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Les réussites se construisent ensemble.</h2>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Logos fictifs de démonstration, à remplacer par les partenaires officiels.</p>
                </div>
                <div aria-label="Exemples de logos partenaires fictifs" className="grid w-full grid-cols-3 items-center gap-3 sm:max-w-2xl sm:grid-cols-6">
                  {partners.map((partner, index) => <div className="flex h-14 items-center justify-center rounded-xl border border-slate-100 bg-[#F8FAFC] px-2 text-[10px] font-extrabold tracking-[0.14em] text-slate-500 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white" key={partner}><span className={index % 2 ? "font-serif text-xs" : ""}>{partner}</span></div>)}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal><SectionHeading eyebrow="Ils avancent avec confiance" title="L’ambition mérite de belles histoires." text="Exemples de témoignages fictifs, à remplacer par des retours vérifiés." /></Reveal>
            <div aria-label="Témoignages fictifs" className="mt-12 grid gap-4 lg:grid-cols-3">
              {testimonials.map((item, index) => (
                <Reveal delay={index * 0.07} key={item.name}>
                  <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                    <div aria-label="5 étoiles sur 5" className="flex gap-1 text-[#D4AF37]">{Array.from({ length: 5 }, (_, star) => <span aria-hidden="true" key={star}>★</span>)}</div>
                    <blockquote className="mt-5 flex-1 text-sm leading-7 text-slate-700 dark:text-slate-200">« {item.quote} »</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-xs font-extrabold text-white ${item.color}`}>{item.initials}</span>
                      <span><span className="block text-sm font-bold text-slate-950 dark:text-white">{item.name}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.role}</span></span>
                      <MessageCircle aria-hidden="true" className="ml-auto h-4 w-4 text-slate-300 dark:text-slate-600" />
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-gradient-to-br from-blue-50 via-[#F8FAFC] to-amber-50/60 py-16 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_.85fr] lg:gap-16 lg:px-8">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"><Smartphone className="h-3.5 w-3.5" /> Le recrutement dans votre poche</div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Votre carrière bouge. JOB-CENTER aussi.</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">Retrouvez l’essentiel de votre recherche d’emploi sur mobile : nouvelles opportunités, notifications et candidatures simplifiées.</p>
              <ul className="mt-7 space-y-3">
                {[
                  "Notifications instantanées sur vos candidatures",
                  "Recherche d’emploi adaptée à l’écran mobile",
                  "Postulation rapide, même en déplacement",
                ].map((item) => <li className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200" key={item}><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />{item}</li>)}
              </ul>
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Smartphone className="h-4 w-4 text-emerald-600" /> Android</span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Smartphone className="h-4 w-4 text-slate-700 dark:text-slate-300" /> iPhone</span>
                <span className="inline-flex items-center rounded-lg bg-[#0F172A] px-3 py-2 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-950">Application en préparation</span>
              </div>
            </Reveal>
            <Reveal className="relative" delay={0.12}>
              <div className="absolute inset-10 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-600/15" />
              {!reduceMotion && <motion.div animate={{ rotate: 360 }} className="absolute inset-[5%] rounded-full border border-dashed border-[#D4AF37]/50" transition={{ duration: 55, repeat: Infinity, ease: "linear" }} />}
              <div className="relative py-2"><AppMockup /></div>
            </Reveal>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Reveal>
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#0F172A] px-6 py-12 text-center text-white shadow-2xl shadow-blue-950/20 sm:px-12 sm:py-16">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_100%,rgba(212,175,55,0.2),transparent_38%),radial-gradient(ellipse_at_90%_0%,rgba(37,99,235,0.4),transparent_42%)]" />
              <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:18px_18px]" />
              <div className="relative mx-auto max-w-2xl">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#E8CC74]"><HeartHandshake className="h-6 w-6" /></span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Votre prochaine étape commence ici</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Les bonnes opportunités commencent ici.</h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100/70 sm:text-base">Un profil à valoriser ou un poste à pourvoir ? JOB-CENTER vous aide à faire la rencontre qui compte.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <PrimaryLink href="/inscription/candidat" light>Créer mon compte candidat <ArrowRight className="h-4 w-4" /></PrimaryLink>
                  <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/inscription/entreprise">Publier une offre <Building2 className="h-4 w-4 text-[#D4AF37]" /></Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr]">
            <div>
              <Brand />
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">La première plateforme de recrutement intelligente au Togo. Les bonnes opportunités commencent ici.</p>
              <div className="mt-5 flex items-center gap-2">
                <a aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white" href="https://www.facebook.com/" rel="noreferrer" target="_blank"><span aria-hidden="true" className="text-sm font-extrabold">f</span></a>
                <a aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-extrabold text-slate-500 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white" href="https://www.linkedin.com/" rel="noreferrer" target="_blank">in</a>
                <a aria-label="X" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white" href="https://x.com/" rel="noreferrer" target="_blank"><X className="h-4 w-4" /></a>
                <a aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white" href="https://www.instagram.com/" rel="noreferrer" target="_blank"><Camera className="h-4 w-4" /></a>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Explorer</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li><Link className="transition hover:text-blue-700 dark:hover:text-blue-300" href="/">Accueil</Link></li>
                <li><Link className="transition hover:text-blue-700 dark:hover:text-blue-300" href="/emplois">Offres d’emploi</Link></li>
                <li><Link className="transition hover:text-blue-700 dark:hover:text-blue-300" href="/inscription/entreprise">Entreprises</Link></li>
                <li><a className="transition hover:text-blue-700 dark:hover:text-blue-300" href="mailto:contact@job-center.tg">Aide & contact</a></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Rejoignez le mouvement</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Créez votre espace et donnez une nouvelle dimension à vos ambitions.</p>
              <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3 dark:text-blue-300" href="/inscription">Commencer maintenant <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} JOB-CENTER · Fait avec ambition au Togo.</p>
            <p className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" /> Vos données restent sous votre contrôle.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
