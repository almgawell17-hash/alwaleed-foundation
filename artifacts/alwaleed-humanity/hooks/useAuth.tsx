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
const PROFILE_KEY = "@alwaleed/profile/v1";

// ─── Admin email — single source of truth ────────────────────────────────────
export const ADMIN_EMAIL = "almgawell17@gmail.com";

// ─── Types ───────────────────────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  isAdmin: boolean;
  isAnonymous: boolean;
};

type LocalProfile = { displayName: string; phone: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAdmin: boolean;
  sessionId: string;
  loading: boolean;
  authDecided: boolean;
  // Email/password login — returns the resolved AuthUser
  login: (email: string, password: string) => Promise<AuthUser>;
  // Alias for signOut
  logout: () => Promise<void>;
  // Google OAuth
  signInWithGoogle: () => Promise<void>;
  skipAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<void>;
  // Admin unlock via secret code (long-press flow)
  unlockAdmin: (code: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeAnonId() {
  return "anon_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function loadLocalProfile(): Promise<LocalProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as LocalProfile;
  } catch {}
  return { displayName: "", phone: "" };
}

async function saveLocalProfile(p: LocalProfile) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {}
}

function buildUser(
  supabaseUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
  },
  localProfile: LocalProfile,
): AuthUser {
  const email = supabaseUser.email ?? "";
  const metaName =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.user_metadata?.name ??
    "";
  return {
    id: supabaseUser.id,
    email,
    name: localProfile.displayName || metaName || email || "مستخدم",
    phone: localProfile.phone || (supabaseUser.user_metadata?.phone ?? ""),
    avatar: supabaseUser.user_metadata?.avatar_url,
    isAdmin: email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    isAnonymous: false,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [authDecided, setAuthDecided] = useState(false);

  const resolveAnonSession = useCallback(async (): Promise<string> => {
    let sid = await AsyncStorage.getItem(ANON_SESSION_KEY).catch(() => null);
    if (!sid) {
      sid = makeAnonId();
      await AsyncStorage.setItem(ANON_SESSION_KEY, sid).catch(() => {});
    }
    return sid;
  }, []);

  // ── Bootstrap on mount ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const decided = await AsyncStorage.getItem(AUTH_DECIDED_KEY).catch(() => null);
        const localProfile = await loadLocalProfile();

        let session = null;
        try {
          const res = await supabase.auth.getSession();
          session = res.data.session;
        } catch {}

        if (cancelled) return;

        if (session?.user) {
          setUser(buildUser(session.user, localProfile));
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

    // Listen for auth state changes (e.g. after email/password login)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        const localProfile = await loadLocalProfile();
        setUser(buildUser(session.user, localProfile));
        setSessionId(session.user.id);
        setAuthDecided(true);
        setLoading(false);
      } else {
        setUser(null);
        const sid = await resolveAnonSession();
        if (!cancelled) {
          setSessionId(sid);
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [resolveAnonSession]);

  // ── Email / Password login ─────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("لم يتم استرداد بيانات المستخدم.");

    const localProfile = await loadLocalProfile();
    const resolvedUser = buildUser(data.user, localProfile);

    await AsyncStorage.setItem(AUTH_DECIDED_KEY, "true").catch(() => {});
    setUser(resolvedUser);
    setSessionId(data.user.id);
    setAuthDecided(true);

    return resolvedUser;
  }, []);

  // ── Google OAuth ──────────────────────────────────────────────────────────
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

  // ── Skip / Sign out ───────────────────────────────────────────────────────
  const skipAuth = useCallback(async () => {
    await AsyncStorage.setItem(AUTH_DECIDED_KEY, "true").catch(() => {});
    setAuthDecided(true);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(AUTH_DECIDED_KEY).catch(() => {});
    setAuthDecided(false);
    setUser(null);
  }, []);

  const logout = signOut;

  // ── Admin unlock via secret code ──────────────────────────────────────────
  const unlockAdmin = useCallback((code: string): boolean => {
    const secret = process.env.EXPO_PUBLIC_ADMIN_SECRET ?? "";
    if (!secret || code.trim() !== secret.trim()) return false;
    setUser((prev) => {
      if (prev) return { ...prev, isAdmin: true };
      return {
        id: sessionId,
        email: "",
        name: "Admin",
        phone: "",
        isAdmin: true,
        isAnonymous: true,
      };
    });
    return true;
  }, [sessionId]);

  // ── Update profile ────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (name: string, phone: string) => {
    const trimName = name.trim();
    const trimPhone = phone.trim();
    const localProfile: LocalProfile = { displayName: trimName, phone: trimPhone };
    await saveLocalProfile(localProfile);

    setUser((u) => {
      if (!u) return u;
      return { ...u, name: trimName || u.name, phone: trimPhone };
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({ data: { full_name: trimName, phone: trimPhone } });
      }
    } catch {}
  }, []);

  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        sessionId,
        loading,
        authDecided,
        login,
        logout,
        signInWithGoogle,
        skipAuth,
        signOut,
        updateProfile,
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
