import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, LoadingState, Notice } from "@/src/components/ui";
import { getSupabase } from "@/src/lib/supabase";
import { colors } from "@/src/theme";

type OtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

function isOtpType(value: string | undefined): value is OtpType {
  switch (value) {
    case "signup":
    case "invite":
    case "magiclink":
    case "recovery":
    case "email_change":
    case "email":
      return true;
    default:
      return false;
  }
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; token_hash?: string; type?: string; error_description?: string }>();
  const [error, setError] = useState<string | null>(params.error_description ?? null);
  const [busy, setBusy] = useState(!params.error_description);

  useEffect(() => {
    let active = true;
    async function completeAuth() {
      if (params.error_description) return;
      try {
        const supabase = getSupabase();
        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError && active) setError(`La confirmation du compte a échoué : ${exchangeError.message}`);
        } else if (params.token_hash && isOtpType(params.type)) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: params.type,
          });
          if (verifyError && active) setError(`La confirmation du compte a échoué : ${verifyError.message}`);
        } else {
          if (active) setError("Le lien de confirmation est incomplet ou expiré.");
        }
      } catch (authError) {
        if (active) setError(authError instanceof Error ? authError.message : "La confirmation du compte a échoué.");
      } finally {
        if (active) setBusy(false);
      }
    }

    void completeAuth();
    return () => {
      active = false;
    };
  }, [params.code, params.error_description, params.token_hash, params.type]);

  useEffect(() => {
    if (!busy && !error) router.replace("/");
  }, [busy, error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{error ? "Confirmation impossible" : "Confirmation du compte"}</Text>
      {busy ? <LoadingState label="Validation du lien sécurisé…" /> : null}
      {error ? <Notice>{error}</Notice> : null}
      {error ? <Button label="Retour à la connexion" onPress={() => router.replace("/(auth)/sign-in")} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 22, fontWeight: "900", textAlign: "center" },
});
