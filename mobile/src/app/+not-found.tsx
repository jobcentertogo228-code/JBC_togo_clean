import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Cette page n’existe pas.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Retour à l’accueil</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 21, fontWeight: "800" },
  link: { marginTop: 15, paddingVertical: 15 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
});
