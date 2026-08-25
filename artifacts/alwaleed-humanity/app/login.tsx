import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, skipAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    const trimEmail = email.trim().toLowerCase();
    const trimPass = password.trim();
    if (!trimEmail || !trimPass) {
      setError(t("auth.errorRequired"));
      return;
    }
    setLoading(true);
    try {
      const resolvedUser = await login(trimEmail, trimPass);
      if (resolvedUser.isAdmin || resolvedUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        router.replace("/admin");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      const code: string = e?.message ?? e?.code ?? "";
      if (
        code.includes("Invalid login") ||
        code.includes("invalid_credentials") ||
        code.includes("wrong-password") ||
        code.includes("user-not-found")
      ) {
        setError(t("auth.errorInvalid"));
      } else if (code.includes("too-many-requests") || code.includes("rate limit")) {
        setError(t("auth.errorTooMany"));
      } else if (code.includes("Email not confirmed")) {
        setError(t("auth.errorUnconfirmed"));
      } else {
        setError(t("auth.errorNetwork"));
      }
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async () => {
    await skipAuth();
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>

        {/* Logo area */}
        <View style={styles.logoWrap}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
            <Feather name="shield" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            مؤسسة الوليد للإنسانية
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {t("auth.adminLogin")}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>

          {/* Email */}
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.email")}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="right"
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            />
            <Feather name="mail" size={18} color={colors.mutedForeground} />
          </View>

          {/* Password */}
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </Pressable>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.password")}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              textAlign="right"
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 1 }]}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <Feather name="lock" size={18} color={colors.mutedForeground} />
          </View>

          {/* Error */}
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#ef444418", borderColor: "#ef4444" }]}>
              <Feather name="alert-circle" size={13} color="#ef4444" />
              <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>{error}</Text>
            </View>
          ) : null}

          {/* Login button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginBtn,
              { backgroundColor: colors.primary, opacity: pressed || loading ? 0.85 : 1 },
            ]}
          >
            {loading
              ? <ActivityIndicator color={colors.primaryForeground} size="small" />
              : <Text style={[styles.loginBtnText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>{t("auth.login")}</Text>
            }
          </Pressable>

          {/* Guest button */}
          <Pressable
            onPress={continueAsGuest}
            style={({ pressed }) => [styles.guestBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.guestText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {t("auth.guestBtn")}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28 },
  logoWrap: { alignItems: "center", gap: 12, marginBottom: 44 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 20, textAlign: "center" },
  subtitle: { fontSize: 13 },
  form: { gap: 14 },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, textAlign: "right" },
  errorBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { color: "#ef4444", fontSize: 13, flex: 1, textAlign: "right" },
  loginBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  loginBtnText: { fontSize: 16 },
  guestBtn: { alignItems: "center", paddingVertical: 10 },
  guestText: { fontSize: 13 },
});
