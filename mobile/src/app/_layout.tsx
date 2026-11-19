import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/src/lib/auth";
import { NotificationCountProvider } from "@/src/lib/notification-count";
import { colors } from "@/src/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationCountProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="jobs/[slug]" options={{ presentation: "card" }} />
        </Stack>
      </NotificationCountProvider>
    </AuthProvider>
  );
}
