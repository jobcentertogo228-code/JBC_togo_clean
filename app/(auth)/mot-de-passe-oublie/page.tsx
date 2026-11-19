import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Mot de passe oublié</h1>
        <p className="muted">Nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
        <ForgotPasswordForm />
        <Link href="/connexion">Retour à la connexion</Link>
      </section>
    </main>
  );
}
