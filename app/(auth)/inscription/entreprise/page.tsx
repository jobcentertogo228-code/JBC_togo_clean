import type { Metadata } from "next";
import Link from "next/link";
import { CompanySignUpForm } from "@/components/auth/company-sign-up-form";

export const metadata: Metadata = { title: "Inscription entreprise" };

export default function CompanySignUpPage() {
  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Créer un espace entreprise</h1>
        <p className="muted">L’espace et son compte propriétaire seront créés ensemble.</p>
        <CompanySignUpForm />
        <p className="muted">Déjà inscrit ? <Link href="/connexion">Se connecter</Link></p>
      </section>
    </main>
  );
}
