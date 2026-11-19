import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AccountRole, Database } from "@/types/database";

export type AuthenticatedProfile = {
  id: string;
  account_role: AccountRole;
  full_name: string;
  avatar_url: string | null;
};

export async function lookupProfileForUser(
  supabase: SupabaseClient<Database>,
  user: User,
  source: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, account_role, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const details = {
    source,
    userId: user.id,
    profileFound: Boolean(data),
    accountRole: data?.account_role ?? null,
    error: error
      ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }
      : null,
  };

  if (error) {
    console.error("[auth/profile] Échec de lecture du profil.", details);
  } else if (!data) {
    console.warn("[auth/profile] Aucun profil trouvé pour l’utilisateur authentifié.", details);
  } else {
    console.info("[auth/profile] Profil trouvé.", details);
  }

  return { profile: data, error };
}
