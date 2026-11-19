import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { employmentLabel, formatDate, formatSalary, type Job } from "@/src/lib/jobs";
import { colors } from "@/src/theme";

export function JobCard({ job }: { job: Job }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/jobs/[slug]", params: { slug: job.slug } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.logo}><Text style={styles.logoText}>{job.companyName.slice(0, 1).toUpperCase()}</Text></View>
        <View style={styles.topText}>
          <Text style={styles.company} numberOfLines={1}>{job.companyName}</Text>
          <Text style={styles.date}>{formatDate(job.published_at)}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>{job.city || "Togo"}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metadataText}>{employmentLabel(job.employment_type)}</Text>
      </View>
      {job.summary ? <Text style={styles.summary} numberOfLines={2}>{job.summary}</Text> : null}
      <View style={styles.bottom}>
        <Text style={styles.salary}>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</Text>
        {job.domain ? <Text style={styles.domain} numberOfLines={1}>{job.domain}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: 10,
  },
  pressed: { opacity: 0.88 },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  logoText: { color: colors.primary, fontWeight: "900", fontSize: 17 },
  topText: { flex: 1 },
  company: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  date: { marginTop: 3, color: colors.muted, fontSize: 11 },
  chevron: { color: colors.muted, fontSize: 27 },
  title: { color: colors.ink, fontSize: 17, fontWeight: "800", lineHeight: 23 },
  metadata: { flexDirection: "row", alignItems: "center", gap: 7 },
  metadataText: { color: colors.muted, fontSize: 12 },
  dot: { color: colors.accent, fontSize: 16, fontWeight: "900" },
  summary: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 2 },
  salary: { color: colors.primary, fontSize: 12, fontWeight: "800", flexShrink: 1 },
  domain: { maxWidth: "42%", overflow: "hidden", color: colors.ink, fontSize: 11, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
});
