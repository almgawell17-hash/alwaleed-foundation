import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

const ANON_SESSION_KEY = "@alwaleed/session/v2";
const AUTH_DECIDED_KEY = "@alwaleed/auth-decided/v1";

const ADMIN_SECRET =
  (process.env.EXPO_PUBLIC_ADMIN_SECRET as string | undefined) ??
  "alwaleed-admin-2024";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAdmin: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  sessionId: string;
  loading: boolean;
  authDecided: boolean;
  signInWithGoogle: () => Promise<void>;
  skipAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  unlockAdmin: (secret: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function makeAnonId() {
  return "anon_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buildUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, string> }, isAdmin: boolean): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name:
      supabaseUser.user_metadata?.full_name ??
      supabaseUser.user_metadata?.name ??
      supabaseUser.email ??
      "مستخدم",
    avatar: supabaseUser.user_metadata?.avatar_url,
    isAdmin,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [authDecided, setAuthDecided] = useState(false);
  const adminUnlockedRef = useRef(false);

  const resolveAnonSession = useCallback(async (): Promise<string> => {
    let sid = await AsyncStorage.getItem(ANON_SESSION_KEY).catch(() => null);
    if (!sid) {
      sid = makeAnonId();
      await AsyncStorage.setItem(ANON_SESSION_KEY, sid).catch(() => {});
    }
    return sid;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const decided = await AsyncStorage.getItem(AUTH_DECIDED_KEY).catch(() => null);
        let session = null;
        try {
          const res = await supabase.auth.getSession();
          session = res.data.session;
        } catch {}

        if (cancelled) return;

        if (session?.user) {
          const isAdmin = adminUnlockedRef.current;
          setUser(buildUser(session.user, isAdmin));
          setSessionId(session.user.id);
          setAuthDecided(true);
        } else {
          const sid = await resolveAnonSession();
          if (cancelled) return;
          setSessionId(sid);
          setAuthDecided(decided === "true");
        }
      } catch {}

      if (!cancelled) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          const isAdmin = adminUnlockedRef.current;
          setUser(buildUser(session.user, isAdmin));
          setSessionId(session.user.id);
          setAuthDecided(true);
        } else {
          setUser(null);
          const sid = await resolveAnonSession();
          if (!cancelled) setSessionId(sid);
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [resolveAnonSession]);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS === "web") {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      return;
    }

    const { makeRedirectUri } = await import("expo-auth-session");
    const redirectTo = makeRedirectUri({ scheme: "alwaleed-humanity" });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error("لم يتم الحصول على رابط المصادقة");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success") {
      const fragment = new URL(result.url).hash.slice(1);
      const params: Record<string, string> = {};
      for (const part of fragment.split("&")) {
        const [k, v] = part.split("=");
        if (k) params[k] = decodeURIComponent(v ?? "");
      }
      if (params.access_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token ?? "",
        });
      }
    }
    await AsyncStorage.setItem(AUTH_DECIDED_KEY, "true").catch(() => {});
    setAuthDecided(true);
  }, []);

  const skipAuth = useCallback(async () => {
    await AsyncStorage.setItem(AUTH_DECIDED_KEY, "true").catch(() => {});
    setAuthDecided(true);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(AUTH_DECIDED_KEY).catch(() => {});
    setAuthDecided(false);
  }, []);

  const unlockAdmin = useCallback((secret: string): boolean => {
    if (secret.trim() === ADMIN_SECRET) {
      adminUnlockedRef.current = true;
      setUser((u) => (u ? { ...u, isAdmin: true } : null));
      return true;
    }
    return false;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionId,
        loading,
        authDecided,
        signInWithGoogle,
        skipAuth,
        signOut,
        unlockAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
