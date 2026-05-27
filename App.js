import React from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>مؤسسة الوليد للإنسانية</Text>
        <Text style={styles.subtitle}>
          بوابة تسجيل دخول المتطوعين والمحتاجين والمانحين
        </Text>
        
        {/* تم حذف زر تسجيل الدخول عبر Google من هنا */}

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
  footer: {
    marginTop: 20,
    fontSize: 12,
    color: "#a0aec0",
    textAlign: "center",
  },
});
