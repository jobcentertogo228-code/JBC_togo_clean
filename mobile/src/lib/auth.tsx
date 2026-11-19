import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabase } from "@/src/lib/supabase";

type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "account_role" | "full_name" | "phone" | "avatar_url">;

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  configurationError: string | null;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, account_role, full_name, phone, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const details = {
    userId,
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
    console.error("[auth/profile] Échec de lecture du profil mobile.", details);
  } else if (!data) {
    console.warn("[auth/profile] Aucun profil trouvé pour l’utilisateur mobile authentifié.", details);
  } else {
    console.info("[auth/profile] Profil mobile trouvé.", details);
  }

  return { data, error };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch (error) {
      setConfigurationError(error instanceof Error ? error.message : "La configuration Supabase est invalide.");
      setLoading(false);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    const appStateSubscription = Platform.OS === "web"
      ? null
      : AppState.addEventListener("change", (state) => {
          if (state === "active") void supabase.auth.startAutoRefresh();
          else void supabase.auth.stopAutoRefresh();
        });
    if (Platform.OS !== "web" && AppState.currentState === "active") {
      void supabase.auth.startAutoRefresh();
    }

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setProfileError(`Impossible de restaurer la session : ${error.message}`);
        setSession(data.session);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setProfileError(error instanceof Error ? `Impossible de restaurer la session : ${error.message}` : "Impossible de restaurer la session.");
        setLoading(false);
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      appStateSubscription?.remove();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    try {
      const { data, error } = await loadProfile(session.user.id);

      if (error) {
        setProfileError(`Impossible de charger votre compte : ${error.message}`);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      setProfileError(error instanceof Error ? `Impossible de charger votre compte : ${error.message}` : "Impossible de charger votre compte.");
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    void loadProfile(session.user.id)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setProfileError(`Impossible de charger votre compte : ${error.message}`);
          setProfile(null);
        } else {
          setProfile(data);
        }
        setProfileLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setProfileError(error instanceof Error ? `Impossible de charger votre compte : ${error.message}` : "Impossible de charger votre compte.");
        setProfile(null);
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await getSupabase().auth.signOut();
      return error?.message ?? null;
    } catch (error) {
      return error instanceof Error ? error.message : "La déconnexion a échoué.";
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      profileLoading,
      configurationError,
      profileError,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, profileLoading, configurationError, profileError, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider.");
  return context;
}
