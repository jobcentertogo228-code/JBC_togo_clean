import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="page-shell main-content">
      <section className="auth-card" aria-labelledby="offline-title">
        <p className="muted">JOB-CENTER</p>
        <h1 id="offline-title">Vous êtes hors ligne</h1>
        <p className="muted">
          Cette page n’est pas disponible sans connexion. Vos données de compte et les offres
          ne sont pas conservées hors ligne.
        </p>
        <Link className="button" href="/">Réessayer</Link>
      </section>
    </main>
  );
}
