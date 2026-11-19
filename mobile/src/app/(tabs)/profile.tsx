import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Heading, LoadingState, Notice, Page, TextField } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { getSupabase } from "@/src/lib/supabase";
import { colors } from "@/src/theme";

type Resume = {
  id: string;
  title: string;
  is_default: boolean;
  created_at: string;
};

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxFileSize = 10 * 1024 * 1024;

export default function ProfileScreen() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [headline, setHeadline] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [summary, setSummary] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const userId = session.user.id;
      const [candidateResult, resumesResult] = await Promise.all([
        getSupabase()
          .from("candidates")
          .select("display_name, headline, summary, city, years_experience")
          .eq("profile_id", userId)
          .maybeSingle(),
        getSupabase()
          .from("resumes")
          .select("id, title, is_default, created_at")
          .eq("candidate_id", userId)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (candidateResult.error || resumesResult.error) {
        setError(`Impossible de charger votre profil : ${candidateResult.error?.message ?? resumesResult.error?.message}`);
      } else {
        const candidate = candidateResult.data;
        setFullName(profile?.full_name ?? candidate?.display_name ?? "");
        setPhone(profile?.phone ?? "");
        setHeadline(candidate?.headline ?? "");
        setCity(candidate?.city ?? "");
        setExperience(candidate?.years_experience?.toString() ?? "");
        setSummary(candidate?.summary ?? "");
        setResumes(resumesResult.data ?? []);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger votre profil.");
    } finally {
      setLoading(false);
    }
  }, [session, profile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile() {
    if (!session) return;
    if (fullName.trim().length < 2) {
      setError("Saisissez un nom d’au moins deux caractères.");
      return;
    }
    const years = experience.trim() ? Number(experience) : null;
    if (years !== null && (!Number.isFinite(years) || years < 0 || years > 80)) {
      setError("L’expérience doit être comprise entre 0 et 80 ans.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = getSupabase();
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", session.user.id);
      if (profileUpdateError) {
        setError(`Impossible d’enregistrer vos informations : ${profileUpdateError.message}`);
        return;
      }

      const { error: candidateUpdateError } = await supabase.from("candidates").upsert(
        {
          profile_id: session.user.id,
          display_name: fullName.trim(),
          headline: headline.trim() || null,
          city: city.trim() || null,
          years_experience: years,
          summary: summary.trim() || null,
        },
        { onConflict: "profile_id" },
      );
      if (candidateUpdateError) {
        setError(`Vos informations personnelles ont été enregistrées, mais le profil candidat n’a pas pu être sauvegardé : ${candidateUpdateError.message}`);
        return;
      }

      await refreshProfile();
      setMessage("Votre profil a été mis à jour.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Votre profil n’a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadResume() {
    if (!session) return;
    setError(null);
    setMessage(null);
    let picked: DocumentPicker.DocumentPickerResult;
    try {
      picked = await DocumentPicker.getDocumentAsync({
        type: allowedMimeTypes,
        copyToCacheDirectory: true,
        multiple: false,
      });
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : "Impossible d’ouvrir le sélecteur de fichiers.");
      return;
    }
    if (picked.canceled) return;

    const file = picked.assets[0];
    const mimeType = file.mimeType;
    if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
      setError("Format non pris en charge. Sélectionnez un fichier PDF, DOC ou DOCX.");
      return;
    }
    if (file.size !== undefined && (file.size < 1 || file.size > maxFileSize)) {
      setError("Le CV doit peser moins de 10 Mo.");
      return;
    }

    setUploading(true);
    const supabase = getSupabase();
    const userId = session.user.id;
    let uploadedPath: string | null = null;
    try {
      const { error: candidateError } = await supabase.from("candidates").upsert(
        { profile_id: userId, display_name: fullName.trim() || profile?.full_name || null },
        { onConflict: "profile_id" },
      );
      if (candidateError) throw new Error(`Impossible de préparer votre profil candidat : ${candidateError.message}`);

      const response = await fetch(file.uri);
      if (!response.ok) throw new Error("Le fichier sélectionné ne peut pas être lu.");
      const blob = await response.blob();
      if (blob.size < 1 || blob.size > maxFileSize) throw new Error("Le CV doit peser entre 1 octet et 10 Mo.");

      const safeName = file.name.replace(/[^\w.-]/g, "_").slice(-120) || "cv";
      uploadedPath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
      const { error: storageError } = await supabase.storage
        .from("candidate-resumes")
        .upload(uploadedPath, blob, { contentType: mimeType, upsert: false });
      if (storageError) throw new Error(`Impossible de téléverser le CV : ${storageError.message}`);

      const { data: defaultResume, error: resumeLookupError } = await supabase
        .from("resumes")
        .select("id")
        .eq("candidate_id", userId)
        .eq("is_default", true)
        .maybeSingle();
      if (resumeLookupError) throw new Error(`Impossible de vérifier le CV principal : ${resumeLookupError.message}`);

      const { data: newResume, error: insertError } = await supabase
        .from("resumes")
        .insert({
          candidate_id: userId,
          title: file.name.slice(0, 160),
          storage_path: uploadedPath,
          mime_type: mimeType,
          size_bytes: blob.size,
          is_default: !defaultResume,
        })
        .select("id, title, is_default, created_at")
        .single();
      if (insertError) throw new Error(`Le fichier est envoyé, mais son ajout au profil a échoué : ${insertError.message}`);

      setResumes((current) => [newResume, ...current]);
      setMessage("Votre CV a été ajouté à votre profil.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Le CV n’a pas pu être ajouté.";
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from("candidate-resumes").remove([uploadedPath]);
        if (cleanupError) {
          console.error("Could not remove orphaned mobile CV upload:", cleanupError.message);
          setError(`${message} Le fichier temporaire n’a pas pu être nettoyé; contactez le support.`);
          return;
        }
      }
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    try {
      const signOutError = await signOut();
      if (signOutError) setError(`Impossible de se déconnecter : ${signOutError}`);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Impossible de se déconnecter.");
    }
  }

  if (loading) return <Page><LoadingState label="Chargement du profil…" /></Page>;

  return (
    <Page>
      <Heading title="Mon profil" subtitle="Présentez votre expérience aux recruteurs." />
      {error ? <Notice>{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <View style={styles.formCard}>
        <Text style={styles.groupTitle}>Informations professionnelles</Text>
        <TextField label="Nom complet" value={fullName} onChangeText={setFullName} autoComplete="name" placeholder="Votre nom" />
        <TextField label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+228…" />
        <TextField label="Titre professionnel" value={headline} onChangeText={setHeadline} placeholder="Ex. Assistante comptable" />
        <TextField label="Ville" value={city} onChangeText={setCity} placeholder="Lomé" />
        <TextField
          label="Années d’expérience"
          value={experience}
          onChangeText={setExperience}
          keyboardType="decimal-pad"
          placeholder="Ex. 3"
        />
        <TextField label="À propos de vous" value={summary} onChangeText={setSummary} multiline placeholder="Présentez votre parcours et vos objectifs…" />
        <Button label="Enregistrer le profil" loading={saving} onPress={() => void saveProfile()} />
      </View>

      <View style={styles.formCard}>
        <View style={styles.resumeHeader}>
          <View style={styles.resumeIcon}><Text style={styles.resumeIconText}>CV</Text></View>
          <View style={styles.resumeTitle}>
            <Text style={styles.groupTitle}>Mon CV</Text>
            <Text style={styles.caption}>PDF, DOC ou DOCX · 10 Mo maximum</Text>
          </View>
        </View>
        {resumes.length ? resumes.map((resume) => (
          <View key={resume.id} style={styles.resumeRow}>
            <Text style={styles.fileGlyph}>▤</Text>
            <Text style={styles.resumeName} numberOfLines={1}>{resume.title}</Text>
            {resume.is_default ? <Text style={styles.defaultBadge}>Principal</Text> : null}
          </View>
        )) : (
          <Text style={styles.caption}>Aucun CV ajouté. Un CV est requis pour postuler.</Text>
        )}
        <Button label={uploading ? "Téléversement…" : "Ajouter un CV"} loading={uploading} onPress={() => void uploadResume()} variant="secondary" />
      </View>

      <View style={styles.accountCard}>
        <Text style={styles.groupTitle}>Compte</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
        <Button label="Se déconnecter" variant="ghost" onPress={() => void handleSignOut()} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  formCard: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 14 },
  groupTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  resumeHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  resumeIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.primarySoft },
  resumeIconText: { color: colors.primary, fontSize: 13, fontWeight: "900" },
  resumeTitle: { gap: 3 },
  resumeRow: { flexDirection: "row", alignItems: "center", gap: 9, padding: 11, borderRadius: 12, backgroundColor: colors.background },
  fileGlyph: { color: colors.primary, fontSize: 19 },
  resumeName: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: "700" },
  defaultBadge: { color: colors.success, fontSize: 10, fontWeight: "800" },
  accountCard: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 8 },
  email: { color: colors.muted, fontSize: 13 },
});
