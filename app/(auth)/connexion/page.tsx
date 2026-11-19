import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Connexion</h1>
        <p className="muted">Accédez à votre espace JOB-CENTER.</p>
        {params.error === "callback" && (
          <p className="feedback feedback-error" role="alert">
            Le lien de confirmation est invalide ou a expiré. Connectez-vous ou demandez un nouveau lien.
          </p>
        )}
        <SignInForm nextPath={params.next ?? ""} />
        <p className="muted">
          Vous n’avez pas de compte ?{" "}
          <Link href={params.next ? `/inscription/candidat?next=${encodeURIComponent(params.next)}` : "/inscription"}>
            Créer un compte
          </Link>
        </p>
      </section>
    </main>
  );
}
