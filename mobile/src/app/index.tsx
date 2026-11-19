import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button, BrandMark } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { colors } from "@/src/theme";

export default function IndexScreen() {
  const { session, profile, loading, profileLoading, configurationError, profileError, refreshProfile, signOut } = useAuth();

  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.splash}>
        <BrandMark large />
        <Text style={styles.brand}>JOB-CENTER</Text>
        <Text style={styles.tagline}>L’opportunité au bon endroit.</Text>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  if (configurationError || profileError) {
    return (
      <View style={styles.center}>
        <BrandMark large />
        <Text style={styles.title}>{configurationError ? "Configuration requise" : "Connexion indisponible"}</Text>
        <Text style={styles.message}>{configurationError ?? profileError}</Text>
        {session && !configurationError ? (
          <Button label="Réessayer" onPress={() => void refreshProfile()} style={styles.signOut} />
        ) : null}
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  if (profile && profile.account_role !== "candidate") {
    return (
      <View style={styles.center}>
        <BrandMark large />
        <Text style={styles.title}>Espace candidat</Text>
        <Text style={styles.message}>
          Cette application mobile est destinée aux candidats. Connectez-vous avec un compte candidat ou utilisez JOB-CENTER sur le web.
        </Text>
        <Button label="Se déconnecter" onPress={() => void signOut()} style={styles.signOut} />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: colors.background,
  },
  brand: { marginTop: 16, color: colors.ink, fontSize: 24, fontWeight: "800", letterSpacing: 1.2 },
  tagline: { marginTop: 6, color: colors.muted, fontSize: 14 },
  spinner: { marginTop: 28 },
  title: { marginTop: 20, color: colors.ink, fontSize: 23, fontWeight: "800", textAlign: "center" },
  message: { marginTop: 10, color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: "center" },
  signOut: { marginTop: 24, width: "100%" },
});
