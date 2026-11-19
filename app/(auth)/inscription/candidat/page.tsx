import type { Metadata } from "next";
import Link from "next/link";
import { CandidateSignUpForm } from "@/components/auth/candidate-sign-up-form";

export const metadata: Metadata = { title: "Inscription candidat" };

export default async function CandidateSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Créer un compte candidat</h1>
        <p className="muted">Créez votre accès pour construire votre profil professionnel.</p>
        <CandidateSignUpForm nextPath={next ?? ""} />
        <p className="muted">Déjà inscrit ? <Link href={next
          ? `/connexion?next=${encodeURIComponent(next)}`
          : "/connexion"}>Se connecter</Link></p>
      </section>
    </main>
  );
}
