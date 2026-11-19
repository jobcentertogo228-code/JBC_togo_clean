"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/candidate", label: "Vue d’ensemble", icon: LayoutDashboard, exact: true },
  { href: "/candidate/profil", label: "Mon profil", icon: UserRound },
  { href: "/candidate/cv", label: "Mon CV", icon: FileText },
  { href: "/candidate/offres", label: "Offres recommandées", icon: BriefcaseBusiness },
  { href: "/candidate/offres/sauvegardees", label: "Offres sauvegardées", icon: Bookmark, exact: true },
  { href: "/candidate/candidatures", label: "Candidatures", icon: BriefcaseBusiness },
  { href: "/candidate/notifications", label: "Notifications", icon: Bell },
  { href: "/candidate/parametres", label: "Paramètres", icon: Settings },
];

export function CandidateNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation candidat" className="flex gap-1 overflow-x-auto px-4 pb-3 md:flex-col md:overflow-visible md:px-3">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href
            || (pathname.startsWith(`${href}/`) && href !== "/candidate/offres");

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
