import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/src/theme";

export function Page({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.pageContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.pageContent, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <View style={[styles.brandMark, large && styles.brandMarkLarge]}>
      <Text style={[styles.brandLetter, large && styles.brandLetterLarge]}>J</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "ghost" && styles.buttonGhost,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.surface : colors.primary} />
      ) : (
        <Text style={[styles.buttonText, variant !== "primary" && styles.buttonSecondaryText]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline && styles.multiline, error && styles.inputError, style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Notice({ children, tone = "error" }: { children: string; tone?: "error" | "success" }) {
  return (
    <View style={[styles.notice, tone === "success" && styles.noticeSuccess]}>
      <Text style={[styles.noticeText, tone === "success" && styles.noticeTextSuccess]}>{children}</Text>
    </View>
  );
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headingSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>J</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  pageContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 36, gap: spacing.md },
  fill: { flex: 1 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  brandMarkLarge: { width: 70, height: 70, borderRadius: 24 },
  brandLetter: { color: colors.surface, fontSize: 24, fontWeight: "900" },
  brandLetterLarge: { fontSize: 40 },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  buttonSecondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  buttonGhost: { backgroundColor: "transparent" },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: "700" },
  buttonSecondaryText: { color: colors.primary },
  field: { gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 112, textAlignVertical: "top" },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12 },
  notice: { padding: 13, borderRadius: 12, backgroundColor: colors.dangerSoft },
  noticeSuccess: { backgroundColor: colors.primarySoft },
  noticeText: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  noticeTextSuccess: { color: colors.success },
  heading: { gap: 5, marginBottom: 3 },
  headingTitle: { color: colors.ink, fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  headingSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  loading: { paddingVertical: 32, alignItems: "center", gap: 10 },
  loadingText: { color: colors.muted, fontSize: 13 },
  empty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 18 },
  emptyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  emptyIconText: { color: colors.primary, fontSize: 19, fontWeight: "900" },
  emptyTitle: { marginTop: 13, color: colors.ink, fontSize: 16, fontWeight: "800", textAlign: "center" },
  emptyMessage: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
});
