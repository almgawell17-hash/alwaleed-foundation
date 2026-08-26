import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onGoogleSignIn: () => Promise<void>;
  onSkip: () => void;
};

export function AuthModal({ visible, onGoogleSignIn, onSkip }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await onGoogleSignIn();
    } catch {
      setError("تعذّر تسجيل الدخول عبر Google. تحقق من الاتصال وأعد المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/ad.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text
            style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
          >
            مرحباً بك في الدعم الفني
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
          >
            سجّل دخولك للاحتفاظ بسجل محادثتك عبر أجهزتك، أو تابع بشكل مجهول.
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#E5484D22", borderColor: "#E5484D55" }]}>
              <Text style={[styles.errorText, { color: "#E5484D", fontFamily: "Inter_400Regular" }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleGoogle}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleBtn,
              {
                backgroundColor: "#fff",
                borderColor: "#E2E8F0",
                opacity: pressed || loading ? 0.85 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <View style={styles.googleIconWrap}>
                  {Platform.OS === "web" ? (
                    <Text style={styles.googleIconText}>G</Text>
                  ) : (
                    <Feather name="globe" size={18} color="#4285F4" />
                  )}
                </View>
                <Text style={[styles.googleBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  تسجيل الدخول بـ Google
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              أو
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text
              style={[styles.skipText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}
            >
              متابعة بدون تسجيل دخول
            </Text>
          </Pressable>

          <Text
            style={[styles.note, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
          >
            لن نشارك بياناتك مع أي طرف ثالث.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: "center",
    gap: 14,
  },
  logoWrap: {
    width: 100,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  errorBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  googleBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleBtnText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    textDecorationLine: "underline",
  },
  note: {
    fontSize: 11,
    textAlign: "center",
    marginTop: -4,
  },
});
