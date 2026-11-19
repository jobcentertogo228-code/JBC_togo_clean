import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { BrandMark, Button, Notice, Page, TextField } from "@/src/components/ui";
import { getSupabase } from "@/src/lib/supabase";
import { colors } from "@/src/theme";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Saisissez votre adresse e-mail et votre mot de passe.");
      return;
    }

    setBusy(true);
    try {
      const { error: signInError } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace("/");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "La connexion a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.form}>
        <BrandMark />
        <Text style={styles.eyebrow}>JOB-CENTER · TOGO</Text>
        <Text style={styles.title}>Heureux de vous revoir.</Text>
        <Text style={styles.subtitle}>Connectez-vous pour découvrir les opportunités qui vous correspondent.</Text>
        {error ? <Notice>{error}</Notice> : null}
        <TextField
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="vous@exemple.com"
          returnKeyType="next"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholder="Votre mot de passe"
          onSubmitEditing={() => void submit()}
        />
        <Button label="Se connecter" loading={busy} onPress={() => void submit()} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous n’avez pas de compte ? </Text>
          <Link href="/(auth)/sign-up" style={styles.link}>Créer un compte</Link>
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", paddingVertical: 36 },
  form: { gap: 16 },
  eyebrow: { marginTop: 6, color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { marginTop: -7, marginBottom: 2, color: colors.muted, fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginTop: 4 },
  footerText: { color: colors.muted, fontSize: 13 },
  link: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
