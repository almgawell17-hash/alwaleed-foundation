import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";

type ContactMethod = {
  key: string;
  labelAr: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  url: string;
  color: string;
};

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const methods: ContactMethod[] = [
    {
      key: "email",
      labelAr: "البريد الإلكتروني",
      value: "info@alwaleed-humanity.org",
      icon: "email-outline",
      url: "mailto:info@alwaleed-humanity.org",
      color: colors.primary,
    },
    {
      key: "phone",
      labelAr: "الهاتف",
      value: "+966 11 487 5050",
      icon: "phone-outline",
      url: "tel:+966114875050",
      color: colors.accent,
    },
    {
      key: "web",
      labelAr: "الموقع الإلكتروني",
      value: "alwaleed-humanity.org",
      icon: "web",
      url: "https://www.alwaleed-humanity.org",
      color: "#7C5CFF",
    },
    {
      key: "address",
      labelAr: "المقر الرئيسي",
      value: "الرياض، المملكة العربية السعودية",
      icon: "map-marker-outline",
      url: "https://maps.google.com/?q=Riyadh,Saudi+Arabia",
      color: "#E5484D",
    },
  ];

  const openMethod = async (m: ContactMethod) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    try {
      if (m.url.startsWith("http")) {
        await WebBrowser.openBrowserAsync(m.url);
      } else {
        await Linking.openURL(m.url);
      }
    } catch {
      Alert.alert(m.labelAr, m.value);
    }
  };

  const onSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(
        "حقول مطلوبة",
        "الرجاء تعبئة الاسم والبريد الإلكتروني والرسالة.",
      );
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    Alert.alert(
      "تم إرسال رسالتك",
      "شكراً لتواصلك معنا. سنرد عليك خلال 24 ساعة.",
    );
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.intro}>
          <Text
            style={[
              styles.introTitle,
              {
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                writingDirection: "rtl",
              },
            ]}
          >
            نحن هنا لخدمتك
          </Text>
          <Text
            style={[
              styles.introSub,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                writingDirection: "rtl",
              },
            ]}
          >
            تواصل معنا عبر القنوات التالية أو أرسل رسالة مباشرة وسنرد عليك في
            أقرب وقت.
          </Text>
        </View>

        {/* Contact methods */}
        <View style={styles.methodsList}>
          {methods.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => openMethod(m)}
              style={({ pressed }) => [
                styles.methodRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.methodIcon,
                  { backgroundColor: m.color + "1F" },
                ]}
              >
                <MaterialCommunityIcons
                  name={m.icon}
                  size={22}
                  color={m.color}
                />
              </View>
              <View style={styles.methodText}>
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "Inter_500Medium",
                      writingDirection: "rtl",
                    },
                  ]}
                >
                  {m.labelAr}
                </Text>
                <Text
                  style={[
                    styles.methodValue,
                    {
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {m.value}
                </Text>
              </View>
              <Feather
                name="chevron-left"
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          ))}
        </View>

        {/* Office hours */}
        <Card>
          <View style={styles.hoursHeader}>
            <Feather name="clock" size={16} color={colors.accent} />
            <Text
              style={[
                styles.hoursTitle,
                {
                  color: colors.foreground,
                  fontFamily: "Inter_700Bold",
                  writingDirection: "rtl",
                },
              ]}
            >
              ساعات العمل
            </Text>
          </View>
          <View style={styles.hoursList}>
            {[
              { day: "الأحد - الخميس", hours: "8:00 ص - 5:00 م" },
              { day: "الجمعة - السبت", hours: "مغلق" },
            ].map((h) => (
              <View key={h.day} style={styles.hoursRow}>
                <Text
                  style={[
                    styles.hoursDay,
                    {
                      color: colors.foreground,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {h.day}
                </Text>
                <Text
                  style={[
                    styles.hoursValue,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  {h.hours}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Form */}
        <View style={styles.form}>
          <Text
            style={[
              styles.formTitle,
              {
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                writingDirection: "rtl",
              },
            ]}
          >
            أرسل لنا رسالة
          </Text>

          <Field
            label="الاسم الكامل"
            value={name}
            onChange={setName}
            placeholder="اكتب اسمك هنا"
          />
          <Field
            label="البريد الإلكتروني"
            value={email}
            onChange={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
          />
          <Field
            label="الموضوع"
            value={subject}
            onChange={setSubject}
            placeholder="موضوع الرسالة (اختياري)"
          />
          <Field
            label="الرسالة"
            value={message}
            onChange={setMessage}
            placeholder="اكتب رسالتك هنا..."
            multiline
          />

          <Pressable
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name="send"
              size={16}
              color={colors.primaryForeground}
            />
            <Text
              style={[
                styles.submitText,
                {
                  color: colors.primaryForeground,
                  fontFamily: "Inter_700Bold",
                },
              ]}
            >
              إرسال الرسالة
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
          {
            color: colors.mutedForeground,
            fontFamily: "Inter_500Medium",
            writingDirection: "rtl",
          },
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground + "80"}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        textAlign="right"
        style={[
          styles.fieldInput,
          {
            color: colors.foreground,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
            fontFamily: "Inter_500Medium",
            minHeight: multiline ? 110 : 48,
            textAlignVertical: multiline ? "top" : "center",
            writingDirection: "rtl",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    gap: 22,
  },
  intro: { gap: 6 },
  introTitle: {
    fontSize: 22,
    textAlign: "right",
  },
  introSub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  methodsList: { gap: 10 },
  methodRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodText: { flex: 1, gap: 2 },
  methodLabel: {
    fontSize: 11,
    textAlign: "right",
  },
  methodValue: {
    fontSize: 14,
    textAlign: "right",
  },
  hoursHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  hoursTitle: {
    fontSize: 14,
  },
  hoursList: { gap: 8 },
  hoursRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  hoursDay: { fontSize: 13 },
  hoursValue: { fontSize: 13 },
  form: { gap: 12 },
  formTitle: {
    fontSize: 16,
    textAlign: "right",
    marginBottom: 4,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    textAlign: "right",
  },
  fieldInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  submitBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 4,
  },
  submitText: {
    fontSize: 15,
  },
});
