import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, EmptyState, Heading, LoadingState, Notice, Page, SectionTitle } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { employmentLabel, formatDate, formatSalary, getJobBySlug, workplaceLabel, type Job } from "@/src/lib/jobs";
import { getSupabase } from "@/src/lib/supabase";
import { colors } from "@/src/theme";

export default function JobDetailsScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const { session } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) {
      setError("Cette offre est invalide.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loadedJob = await getJobBySlug(slug);
      setJob(loadedJob);
      if (loadedJob && session) {
        const userId = session.user.id;
        const [savedResult, appliedResult, resumeResult] = await Promise.all([
          getSupabase().from("saved_jobs").select("job_id").eq("candidate_id", userId).eq("job_id", loadedJob.id).maybeSingle(),
          getSupabase().from("applications").select("id").eq("candidate_id", userId).eq("job_id", loadedJob.id).maybeSingle(),
          getSupabase().from("resumes").select("id").eq("candidate_id", userId).limit(1).maybeSingle(),
        ]);
        if (savedResult.error || appliedResult.error || resumeResult.error) {
          throw new Error(savedResult.error?.message ?? appliedResult.error?.message ?? resumeResult.error?.message);
        }
        setSaved(Boolean(savedResult.data));
        setApplied(Boolean(appliedResult.data));
        setHasResume(Boolean(resumeResult.data));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger cette offre.");
    } finally {
      setLoading(false);
    }
  }, [slug, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function toggleSaved() {
    if (!session || !job) return;
    setBusy(true);
    setError(null);
    try {
      const userId = session.user.id;
      const { data: candidate, error: candidateError } = await getSupabase()
        .from("candidates")
        .select("profile_id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (candidateError) {
        setError(`Impossible de vérifier votre profil : ${candidateError.message}`);
        return;
      }
      if (!candidate) {
        Alert.alert("Complétez votre profil", "Enregistrez votre profil candidat avant de sauvegarder une offre.", [
          { text: "Plus tard", style: "cancel" },
          { text: "Mon profil", onPress: () => router.push("/(tabs)/profile") },
        ]);
        return;
      }

      if (saved) {
        const { error: deleteError } = await getSupabase()
          .from("saved_jobs")
          .delete()
          .eq("candidate_id", userId)
          .eq("job_id", job.id);
        if (deleteError) setError(`Impossible de retirer l’offre : ${deleteError.message}`);
        else setSaved(false);
      } else {
        const { error: insertError } = await getSupabase().from("saved_jobs").insert({
          candidate_id: userId,
          job_id: job.id,
        });
        if (insertError) setError(`Impossible de sauvegarder l’offre : ${insertError.message}`);
        else setSaved(true);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible de sauvegarder l’offre.");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!session || !job) return;
    if (applied) return;
    setBusy(true);
    setError(null);
    try {
      const userId = session.user.id;
      const { data: candidate, error: candidateError } = await getSupabase()
        .from("candidates")
        .select("profile_id")
        .eq("profile_id", userId)
        .maybeSingle();
      if (candidateError) {
        setError(`Impossible de vérifier votre profil : ${candidateError.message}`);
        return;
      }
      if (!candidate) {
        Alert.alert("Complétez votre profil", "Enregistrez votre profil candidat avant de postuler.", [
          { text: "Plus tard", style: "cancel" },
          { text: "Mon profil", onPress: () => router.push("/(tabs)/profile") },
        ]);
        return;
      }

      const { data: resume, error: resumeError } = await getSupabase()
        .from("resumes")
        .select("id")
        .eq("candidate_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (resumeError) {
        setError(`Impossible de vérifier votre CV : ${resumeError.message}`);
        return;
      }
      if (!resume) {
        setHasResume(false);
        Alert.alert("CV nécessaire", "Ajoutez un CV à votre profil avant d’envoyer votre candidature.", [
          { text: "Plus tard", style: "cancel" },
          { text: "Ajouter mon CV", onPress: () => router.push("/(tabs)/profile") },
        ]);
        return;
      }

      const { error: applicationError } = await getSupabase().from("applications").insert({
        candidate_id: userId,
        job_id: job.id,
        resume_id: resume.id,
      });
      if (applicationError?.code === "23505") {
        setApplied(true);
        Alert.alert("Candidature déjà envoyée", "Vous avez déjà postulé à cette offre.");
        return;
      }
      if (applicationError) {
        setError(`Votre candidature n’a pas pu être envoyée : ${applicationError.message}`);
        return;
      }
      setApplied(true);
      Alert.alert("Candidature envoyée", "Votre candidature a bien été transmise à l’entreprise.");
    } catch (applicationError) {
      setError(applicationError instanceof Error ? applicationError.message : "Votre candidature n’a pas pu être envoyée.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Page><LoadingState label="Chargement de l’offre…" /></Page>;
  if (!job) {
    return (
      <Page>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Retour</Text></Pressable>
        {error ? <Notice>{error}</Notice> : <EmptyState title="Offre indisponible" message="Cette offre a peut-être expiré ou été retirée." />}
      </Page>
    );
  }

  return (
    <Page>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Retour aux offres</Text></Pressable>
      {error ? <Notice>{error}</Notice> : null}
      <View style={styles.hero}>
        <View style={styles.companyLogo}><Text style={styles.companyInitial}>{job.companyName.slice(0, 1).toUpperCase()}</Text></View>
        <Text style={styles.company}>{job.companyName}</Text>
        <Heading title={job.title} subtitle={`${job.city || "Togo"} · ${employmentLabel(job.employment_type)} · ${workplaceLabel(job.workplace_type)}`} />
        <Text style={styles.salary}>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</Text>
        <Text style={styles.date}>Publié le {formatDate(job.published_at)}</Text>
      </View>

      <View style={styles.actions}>
        <Button label={applied ? "Candidature envoyée" : "Postuler maintenant"} onPress={() => void apply()} loading={busy} disabled={applied} style={styles.applyButton} />
        <Button label={saved ? "Enregistrée ✓" : "Sauvegarder"} onPress={() => void toggleSaved()} loading={busy} variant="secondary" style={styles.saveButton} />
      </View>
      {!hasResume && !applied ? <Text style={styles.hint}>Un CV est nécessaire pour postuler. Ajoutez-le dans votre profil.</Text> : null}

      <View style={styles.section}>
        <SectionTitle title="À propos du poste" />
        <Text style={styles.body}>{job.description}</Text>
      </View>
      {job.requirements ? (
        <View style={styles.section}>
          <SectionTitle title="Profil recherché" />
          <Text style={styles.body}>{job.requirements}</Text>
        </View>
      ) : null}
      {job.benefits ? (
        <View style={styles.section}>
          <SectionTitle title="Avantages" />
          <Text style={styles.body}>{job.benefits}</Text>
        </View>
      ) : null}
      <View style={styles.meta}>
        {job.domain ? <Text style={styles.pill}>{job.domain}</Text> : null}
        {job.experience_level ? <Text style={styles.pill}>Expérience : {job.experience_level}</Text> : null}
        {job.closes_at ? <Text style={styles.pill}>Clôture : {formatDate(job.closes_at)}</Text> : null}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.primary, fontSize: 14, fontWeight: "800", paddingVertical: 5 },
  hero: { padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface, gap: 10 },
  companyLogo: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  companyInitial: { color: colors.primary, fontSize: 20, fontWeight: "900" },
  company: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  salary: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  date: { color: colors.muted, fontSize: 12 },
  actions: { flexDirection: "row", gap: 10 },
  applyButton: { flex: 1, paddingHorizontal: 10 },
  saveButton: { flex: 1, paddingHorizontal: 8 },
  hint: { marginTop: -7, color: colors.muted, fontSize: 12, lineHeight: 18 },
  section: { padding: 17, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface, gap: 10 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 11, fontWeight: "700" },
});
