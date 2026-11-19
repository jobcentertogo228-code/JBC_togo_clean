import { requireAdmin } from "@/lib/auth/roles";

export default async function AdminHomePage() {
  const { profile } = await requireAdmin();

  return (
    <>
      <p className="muted">Administration de la plateforme</p>
      <h1 className="dashboard-title">Bonjour{profile.full_name ? `, ${profile.full_name}` : ""}.</h1>
      <p className="muted">Les outils de modération et de gestion de la plateforme apparaîtront dans cet espace.</p>
    </>
  );
}
