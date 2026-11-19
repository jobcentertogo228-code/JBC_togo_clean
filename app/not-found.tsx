import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="page-shell main-content">
      <section className="mx-auto flex max-w-xl flex-col items-center py-12 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Erreur 404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Cette page est introuvable</h1>
        <p className="mt-3 text-muted-foreground">
          L’adresse a peut-être changé ou la page n’est plus disponible.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link href="/emplois"><Search className="h-4 w-4" />Parcourir les offres</Link></Button>
          <Button asChild variant="outline"><Link href="/"><ArrowLeft className="h-4 w-4" />Accueil</Link></Button>
        </div>
      </section>
    </main>
  );
}
