import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// هذه الخطوة ضرورية لفتح المتصفح داخل التطبيق
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  // إعداد طلب تسجيل الدخول باستخدام الـ Client ID الخاص بك
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "463786966083-u1ol9v509rnkh5ngvqdtrgif8a4g2ger.apps.googleusercontent.com",
    iosClientId: "463786966083-u1ol9v509rnkh5ngvqdtrgif8a4g2ger.apps.googleusercontent.com",
    expoClientId: "463786966083-u1ol9v509rnkh5ngvqdtrgif8a4g2ger.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      console.log("نجح الدخول! رمز التوثيق:", authentication.accessToken);
      alert("تم تسجيل الدخول بنجاح!");
    }
  }, [response]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>مؤسسة الوليد للإنسانية</Text>
        <Text style={styles.subtitle}>بوابة تسجيل دخول المتطوعين والمحتاجين والمانحين</Text>

        <TouchableOpacity 
          style={[styles.button, !request && { opacity: 0.5 }]} 
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>صنع لمساعدة المحتاجين في العالم</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#4a5568', textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#4285F4', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, width: '100%' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  footer: { marginTop: 20, fontSize: 12, color: '#a0aec0' }
});
