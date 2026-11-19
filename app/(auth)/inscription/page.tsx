import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpChoicePage() {
  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Rejoindre JOB-CENTER</h1>
        <p className="muted">Choisissez le type d’espace à créer.</p>
        <div className="form-stack">
          <Link className="button" href="/inscription/candidat">Créer un compte candidat</Link>
          <Link className="button button-secondary" href="/inscription/entreprise">Créer un compte entreprise</Link>
          <Link href="/connexion">J’ai déjà un compte</Link>
        </div>
      </section>
    </main>
  );
}
