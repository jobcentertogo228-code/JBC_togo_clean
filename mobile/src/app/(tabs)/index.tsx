import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, EmptyState, Heading, LoadingState, Notice, Page, SectionTitle } from "@/src/components/ui";
import { JobCard } from "@/src/components/job-card";
import { useAuth } from "@/src/lib/auth";
import { useNotificationCount } from "@/src/lib/notification-count";
import { searchJobs, type Job } from "@/src/lib/jobs";
import { getSupabase } from "@/src/lib/supabase";
import { colors } from "@/src/theme";

export default function DashboardScreen() {
  const { session, profile } = useAuth();
  const { unreadCount: unread, error: notificationError } = useNotificationCount();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const userId = session.user.id;
    try {
      const [jobsResult, applicationsResult] = await Promise.all([
        searchJobs("", "", 3),
        getSupabase().from("applications").select("id", { count: "exact", head: true }).eq("candidate_id", userId),
      ]);

      if (applicationsResult.error) {
        setError(applicationsResult.error.message);
      } else {
        setJobs(jobsResult);
        setApplications(applicationsResult.count ?? 0);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger votre tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "Candidat";

  return (
    <Page>
      <View style={styles.top}>
        <View style={styles.brandLine}>
          <View style={styles.brand}><Text style={styles.brandText}>J</Text></View>
          <Text style={styles.brandName}>JOB-CENTER</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push("/(tabs)/notifications")} style={styles.bell}>
          <Text style={styles.bellText}>🔔</Text>
          {unread > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ESPACE CANDIDAT</Text>
        <Heading title={`Bonjour ${firstName} 👋`} subtitle="Votre prochaine opportunité est peut-être à portée de main." />
        <Button label="Explorer les offres" onPress={() => router.push("/(tabs)/jobs")} style={styles.heroButton} />
      </View>

      {error ? <Notice>{error}</Notice> : null}
      {notificationError ? <Notice>{notificationError}</Notice> : null}

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{loading ? "—" : applications}</Text>
          <Text style={styles.statLabel}>Candidatures</Text>
        </View>
        <View style={[styles.statCard, styles.statCardTint]}>
          <Text style={[styles.statValue, styles.statValueTint]}>{loading ? "—" : unread}</Text>
          <Text style={styles.statLabel}>Alertes non lues</Text>
        </View>
      </View>

      <SectionTitle
        title="Offres récentes"
        action={<Pressable onPress={() => router.push("/(tabs)/jobs")}><Text style={styles.viewAll}>Tout voir →</Text></Pressable>}
      />
      {loading ? <LoadingState label="Chargement des opportunités…" /> : null}
      {!loading && jobs.length === 0 ? (
        <EmptyState title="Aucune offre pour le moment" message="Les nouvelles opportunités apparaîtront ici." />
      ) : null}
      {!loading ? jobs.map((job) => <JobCard key={job.id} job={job} />) : null}
      <View style={styles.tip}>
        <Text style={styles.tipIcon}>✦</Text>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Un profil complet fait la différence</Text>
          <Text style={styles.tipBody}>Ajoutez votre expérience et votre CV pour postuler plus facilement.</Text>
        </View>
        <Button label="Mon profil" variant="secondary" onPress={() => router.push("/(tabs)/profile")} style={styles.tipButton} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandLine: { flexDirection: "row", alignItems: "center", gap: 9 },
  brand: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  brandText: { color: colors.surface, fontSize: 21, fontWeight: "900" },
  brandName: { color: colors.ink, fontSize: 13, fontWeight: "900", letterSpacing: 0.8 },
  bell: { width: 40, height: 40, borderWidth: 1, borderColor: colors.border, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  bellText: { color: colors.ink, fontSize: 20 },
  dot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  hero: { padding: 18, borderRadius: 20, backgroundColor: colors.primarySoft, gap: 10 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  heroButton: { alignSelf: "flex-start", minHeight: 44, marginTop: 2 },
  stats: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, padding: 15, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  statCardTint: { backgroundColor: "#FFF7F0", borderColor: "#F4E2D6" },
  statValue: { color: colors.ink, fontSize: 25, fontWeight: "900" },
  statValueTint: { color: colors.accent },
  statLabel: { marginTop: 4, color: colors.muted, fontSize: 11, fontWeight: "600" },
  viewAll: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  tip: { padding: 15, borderRadius: 18, backgroundColor: colors.ink, gap: 10 },
  tipIcon: { color: "#F4B78E", fontSize: 20 },
  tipCopy: { gap: 4 },
  tipTitle: { color: colors.surface, fontSize: 14, fontWeight: "800" },
  tipBody: { color: "#CFD9E1", fontSize: 12, lineHeight: 18 },
  tipButton: { alignSelf: "flex-start", minHeight: 40, paddingVertical: 9 },
});
