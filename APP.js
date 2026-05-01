import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1a73e8" }}>
        مؤسسة الوليد للإنسانية
      </Text>
      <Text style={{ marginTop: 10 }}>
        أهلاً بك غمر، التطبيق يعمل الآن بنجاح!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
});
