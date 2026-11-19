import { Link, router } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { BrandMark, Button, Notice, Page, TextField } from "@/src/components/ui";
import { getSupabase } from "@/src/lib/supabase";
import { colors } from "@/src/theme";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setMessage(null);
    if (fullName.trim().length < 2) {
      setError("Saisissez votre nom complet.");
      return;
    }
    if (!email.trim()) {
      setError("Saisissez votre adresse e-mail.");
      return;
    }
    if (password.length < 10) {
      setError("Le mot de passe doit contenir au moins 10 caractères.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: signUpError } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: Linking.createURL("auth/callback"),
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        router.replace("/");
        return;
      }
      setMessage("Vérifiez votre boîte e-mail pour confirmer votre compte, puis connectez-vous.");
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "L’inscription a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.form}>
        <BrandMark />
        <Text style={styles.eyebrow}>REJOIGNEZ JOB-CENTER</Text>
        <Text style={styles.title}>Votre prochaine étape commence ici.</Text>
        <Text style={styles.subtitle}>Créez un compte candidat gratuit pour explorer les offres.</Text>
        {error ? <Notice>{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}
        <TextField label="Nom complet" value={fullName} onChangeText={setFullName} autoComplete="name" placeholder="Ex. Ama Mensah" />
        <TextField
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="vous@exemple.com"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="10 caractères minimum"
        />
        <Button label="Créer mon compte" loading={busy} onPress={() => void submit()} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte ? </Text>
          <Link href="/(auth)/sign-in" style={styles.link}>Se connecter</Link>
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", paddingVertical: 28 },
  form: { gap: 15 },
  eyebrow: { marginTop: 5, color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { marginTop: -7, marginBottom: 3, color: colors.muted, fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginTop: 2 },
  footerText: { color: colors.muted, fontSize: 13 },
  link: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
