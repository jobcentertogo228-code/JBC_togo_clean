import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

export default function ResetPasswordPage() {
  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Choisir un nouveau mot de passe</h1>
        <p className="muted">Utilisez un mot de passe unique d’au moins 10 caractères.</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
