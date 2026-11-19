import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState, Heading, LoadingState, Notice, Page } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { getSupabase } from "@/src/lib/supabase";
import type { Database } from "@/types/database";
import { colors } from "@/src/theme";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

function getJobSlug(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("job_slug" in payload)) return null;
  const slug = payload.job_slug;
  return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error: queryError } = await getSupabase()
        .from("notifications")
        .select("id, recipient_id, type, title, body, payload, read_at, created_at")
        .eq("recipient_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (queryError) setError(`Impossible de charger vos notifications : ${queryError.message}`);
      else {
        setItems(data ?? []);
        setError(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger vos notifications.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!session) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel(`mobile-notifications-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${session.user.id}` },
        () => void load(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError("La connexion temps réel aux notifications est interrompue. Faites glisser pour actualiser.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, load]);

  async function markAsRead(item: Notification) {
    if (item.read_at || !session) return;
    const readAt = new Date().toISOString();
    try {
      const { error: updateError } = await getSupabase()
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", item.id)
        .eq("recipient_id", session.user.id);
      if (updateError) {
        setError(`Impossible de marquer la notification comme lue : ${updateError.message}`);
        return;
      }
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, read_at: readAt } : row));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Impossible de marquer la notification comme lue.");
    }
  }

  const unread = items.filter((item) => !item.read_at).length;

  return (
    <Page scroll={false} contentStyle={styles.page}>
      <Heading title="Notifications" subtitle={`${unread} non lue${unread === 1 ? "" : "s"} · vos actualités emploi en direct`} />
      {error ? <Notice>{error}</Notice> : null}
      {loading && items.length === 0 ? <LoadingState label="Chargement des notifications…" /> : null}
      {!loading && items.length === 0 ? <EmptyState title="Vous êtes à jour" message="Les nouvelles offres et les mises à jour de vos candidatures apparaîtront ici." /> : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const slug = getJobSlug(item.payload);
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                void markAsRead(item);
                if (slug) router.push({ pathname: "/jobs/[slug]", params: { slug } });
              }}
              style={({ pressed }) => [styles.card, !item.read_at && styles.unreadCard, pressed && styles.pressed]}
            >
              <View style={[styles.icon, !item.read_at && styles.iconUnread]}>
                <Text style={[styles.iconText, !item.read_at && styles.iconTextUnread]}>{item.type === "new_job" ? "✦" : "•"}</Text>
              </View>
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.read_at ? <View style={styles.unreadDot} /> : null}
                </View>
                {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                <Text style={styles.date}>{new Intl.DateTimeFormat("fr-TG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingBottom: 8 },
  scroll: { flex: 1 },
  list: { gap: 10, paddingBottom: 30, flexGrow: 1 },
  card: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  unreadCard: { borderColor: "#B7DCD7", backgroundColor: "#F8FCFB" },
  pressed: { opacity: 0.85 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  iconUnread: { backgroundColor: colors.primarySoft },
  iconText: { color: colors.muted, fontSize: 20, fontWeight: "900" },
  iconTextUnread: { color: colors.primary },
  copy: { flex: 1, gap: 5 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "800" },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  body: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  date: { marginTop: 2, color: colors.muted, fontSize: 10 },
});
