import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, Heading, Notice, TextField } from "@/src/components/ui";
import { JobCard } from "@/src/components/job-card";
import { searchJobs, type Job } from "@/src/lib/jobs";
import { colors } from "@/src/theme";

export default function JobsScreen() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJobs(await searchJobs(appliedSearch, appliedCity));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les offres.");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedCity]);

  useEffect(() => {
    void load();
  }, [load]);

  const searchForm = (
    <View style={styles.header}>
      <Heading title="Trouver un emploi" subtitle="Parcourez les opportunités au Togo." />
      <View style={styles.filters}>
        <TextField
          label="Métier ou mot-clé"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            setAppliedSearch(search);
            setAppliedCity(city);
          }}
          placeholder="Ex. comptable, marketing…"
          returnKeyType="search"
        />
        <TextField
          label="Ville"
          value={city}
          onChangeText={setCity}
          onSubmitEditing={() => {
            setAppliedSearch(search);
            setAppliedCity(city);
          }}
          placeholder="Lomé, Kara…"
          returnKeyType="search"
        />
        <Pressable
          onPress={() => {
            setAppliedSearch(search);
            setAppliedCity(city);
          }}
          style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
        >
          <Text style={styles.searchButtonText}>Rechercher</Text>
        </Pressable>
        <Text style={styles.results}>{loading ? "Recherche…" : `${jobs.length} offre${jobs.length === 1 ? "" : "s"} disponible${jobs.length === 1 ? "" : "s"}`}</Text>
      </View>
      {error ? <Notice>{error}</Notice> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <FlatList
        data={jobs}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => <JobCard job={item} />}
        ListHeaderComponent={searchForm}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <EmptyState title="Aucune offre trouvée" message="Essayez avec un autre métier ou une autre ville." />
          )
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 34, backgroundColor: colors.background, flexGrow: 1 },
  header: { gap: 14, marginBottom: 18 },
  filters: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 12 },
  searchButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: colors.primary },
  pressed: { opacity: 0.86 },
  searchButtonText: { color: colors.surface, fontSize: 14, fontWeight: "800" },
  results: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  separator: { height: 11 },
  loader: { marginTop: 30 },
});
