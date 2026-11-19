import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/src/lib/auth";
import { getSupabase } from "@/src/lib/supabase";

type NotificationCountContextValue = {
  unreadCount: number;
  error: string | null;
};

const NotificationCountContext = createContext<NotificationCountContextValue | null>(null);

export function NotificationCountProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error: queryError } = await getSupabase()
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", session.user.id)
        .is("read_at", null);
      if (queryError) setError(`Le compteur de notifications n’a pas pu être actualisé : ${queryError.message}`);
      else {
        setUnreadCount(count ?? 0);
        setError(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Le compteur de notifications n’a pas pu être actualisé.");
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setUnreadCount(0);
      setError(null);
      return;
    }

    void refresh();
    const supabase = getSupabase();
    const channel = supabase
      .channel(`mobile-notification-count-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${session.user.id}` },
        () => void refresh(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError("Le compteur de notifications temps réel est temporairement indisponible.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, refresh]);

  const value = useMemo(() => ({ unreadCount, error }), [unreadCount, error]);
  return <NotificationCountContext.Provider value={value}>{children}</NotificationCountContext.Provider>;
}

export function useNotificationCount() {
  const context = useContext(NotificationCountContext);
  if (!context) throw new Error("useNotificationCount doit être utilisé dans NotificationCountProvider.");
  return context;
}
