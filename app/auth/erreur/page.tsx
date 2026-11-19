export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; message?: string }>;
}) {
  const { type, message: callbackMessage } = await searchParams;
  const message = type === "callback" && callbackMessage?.trim()
    ? callbackMessage.trim().slice(0, 500)
    : type === "profile"
    ? "Le profil associé à ce compte n’a pas pu être chargé. Vérifiez les journaux serveur pour distinguer un profil absent d’un refus d’accès Supabase."
    : type === "membership"
      ? "L’appartenance à l’entreprise n’a pas pu être vérifiée. Réessayez ou contactez l’assistance."
      : type === "callback"
        ? "Le lien de confirmation est invalide ou a expiré. Demandez un nouveau lien."
        : "La session n’a pas pu être vérifiée. Reconnectez-vous.";

  return (
    <main className="page-shell main-content">
      <section className="auth-card">
        <h1>Accès momentanément indisponible</h1>
        <p role="alert">{message}</p>
        <a href="/connexion">Retour à la connexion</a>
      </section>
    </main>
  );
}
