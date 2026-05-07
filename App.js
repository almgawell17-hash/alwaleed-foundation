import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

// هذه الخطوة ضرورية لفتح المتصفح وإرجاع المستخدم للتطبيق بعد تسجيل الدخول
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  // إعداد طلب تسجيل الدخول باستخدام الأكواد التي زودتني بها
  const [request, response, promptAsync] = Google.useAuthRequest({
    // معرف العميل الخاص بالويب (ضروري جداً لعمل Expo Go)
    webClientId:
      "463786966083-cc0tvutusboji8eh79kt2j481jocahvo.apps.googleusercontent.com",
    // يمكنك إضافة معرفات الأندرويد والـ iOS هنا إذا قمت بإنشائها لاحقاً
    androidClientId:
      "463786966083-irhs7sfococm842td5tqqi8bss3dp79f.apps.googleusercontent.com",
    iosClientId:
      "463786966083-u5gra94truce0t3e4l9r18t1kbfhoikq.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("نجح الدخول! رمز التوثيق:", authentication.accessToken);
      // هنا يمكنك استخدام الـ Token لإرساله إلى Supabase أو جلب بيانات المستخدم
      alert("تم تسجيل الدخول بنجاح!");
    }
  }, [response]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>مؤسسة الوليد للإنسانية</Text>
        <Text style={styles.subtitle}>
          بوابة تسجيل دخول المتطوعين والمحتاجين والمانحين
        </Text>

        <TouchableOpacity
          style={[styles.button, !request && { opacity: 0.5 }]}
          disabled={!request}
          onPress={() => {
            promptAsync();
          }}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>صنع لمساعدة المحتاجين في العالم</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#4a5568",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    color: "#a0aec0",
    textAlign: "center",
  },
});
