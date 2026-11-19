import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanySetupForm } from "@/components/auth/company-setup-form";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Configuration de l’entreprise" };

export default async function CompanySetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: setupError } = await searchParams;
  const { user, supabase } = await requireUser();
  const { data: membership, error } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to verify company setup: ${error.message}`);
  if (membership) redirect("/company");

  const metadata = user.user_metadata;
  const initialName = typeof metadata.company_name === "string" ? metadata.company_name : "";
  const initialSlug = typeof metadata.company_slug === "string" ? metadata.company_slug : "";

  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Terminer la création de votre entreprise</h1>
        <p className="muted">Votre e-mail est confirmé. Vérifiez les informations de l’espace à créer.</p>
        {setupError === "creation" && (
          <p className="feedback feedback-error" role="alert">
            L’espace n’a pas pu être créé. Vérifiez l’identifiant choisi et réessayez.
          </p>
        )}
        <CompanySetupForm initialName={initialName} initialSlug={initialSlug} />
      </section>
    </main>
  );
}
