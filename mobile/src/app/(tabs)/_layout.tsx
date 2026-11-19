import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { useNotificationCount } from "@/src/lib/notification-count";
import { colors } from "@/src/theme";

export default function TabLayout() {
  const { session, profile, loading, profileLoading, profileError, refreshProfile } = useAuth();
  const { unreadCount } = useNotificationCount();

  if (loading || (session && profileLoading)) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }
  if (profileError) {
    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedTitle}>Impossible de vérifier le compte.</Text>
        <Text style={styles.blockedText}>{profileError}</Text>
        <Button label="Réessayer" onPress={() => void refreshProfile()} style={styles.retry} />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (profile && profile.account_role !== "candidate") {
    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedTitle}>Cette application est réservée aux candidats.</Text>
        <Text style={styles.blockedText}>Utilisez un compte candidat pour accéder à cet espace.</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: "house.fill", android: "home", web: "home" }} tintColor={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Offres",
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: "magnifyingglass", android: "search", web: "search" }} tintColor={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alertes",
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: "bell.fill", android: "notifications", web: "notifications" }} tintColor={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: "person.fill", android: "person", web: "person" }} tintColor={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    height: 66,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabLabel: { fontSize: 11, fontWeight: "600" },
  blocked: { flex: 1, justifyContent: "center", padding: 28, backgroundColor: colors.background },
  blockedTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", textAlign: "center" },
  blockedText: { marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  retry: { marginTop: 18 },
});
