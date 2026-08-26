import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "@alwaleed/language/v1";

type Language = {
  code: string;
  flag: string;
  nameNative: string;
  nameAr: string;
  available: boolean;
};

const LANGUAGES: Language[] = [
  {
    code: "ar",
    flag: "🇸🇦",
    nameNative: "العربية",
    nameAr: "العربية",
    available: true,
  },
  {
    code: "en",
    flag: "🇬🇧",
    nameNative: "English",
    nameAr: "الإنجليزية",
    available: false,
  },
  {
    code: "fr",
    flag: "🇫🇷",
    nameNative: "Français",
    nameAr: "الفرنسية",
    available: false,
  },
  {
    code: "es",
    flag: "🇪🇸",
    nameNative: "Español",
    nameAr: "الإسبانية",
    available: false,
  },
  {
    code: "tr",
    flag: "🇹🇷",
    nameNative: "Türkçe",
    nameAr: "التركية",
    available: false,
  },
  {
    code: "ur",
    flag: "🇵🇰",
    nameNative: "اردو",
    nameAr: "الأردية",
    available: false,
  },
  {
    code: "id",
    flag: "🇮🇩",
    nameNative: "Bahasa Indonesia",
    nameAr: "الإندونيسية",
    available: false,
  },
];

export default function LanguageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>("ar");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v) setSelected(v);
      })
      .catch(() => {});
  }, []);

  const onSelect = (lang: Language) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    if (!lang.available) {
      return;
    }
    setSelected(lang.code);
    AsyncStorage.setItem(STORAGE_KEY, lang.code).catch(() => {});
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
      >
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
            اختر لغتك المفضلة
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
            ستظهر واجهة التطبيق ومحتواه باللغة التي تختارها.
          </Text>
        </View>

        <Card padded={false} style={{ overflow: "hidden" }}>
          {LANGUAGES.map((lang, idx) => {
            const isSelected = selected === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => onSelect(lang)}
                disabled={!lang.available}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderTopColor: colors.border,
                    borderTopWidth:
                      idx === 0 ? 0 : StyleSheet.hairlineWidth,
                    backgroundColor:
                      pressed && lang.available
                        ? colors.secondary
                        : "transparent",
                    opacity: lang.available ? 1 : 0.55,
                  },
                ]}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.rowText}>
                  <Text
                    style={[
                      styles.langName,
                      {
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                  >
                    {lang.nameNative}
                  </Text>
                  <Text
                    style={[
                      styles.langSub,
                      {
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                        writingDirection: "rtl",
                      },
                    ]}
                  >
                    {lang.nameAr}
                    {!lang.available ? " · قريباً" : ""}
                  </Text>
                </View>
                {isSelected ? (
                  <View
                    style={[
                      styles.checkBubble,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Feather
                      name="check"
                      size={14}
                      color={colors.primaryForeground}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.emptyBubble,
                      { borderColor: colors.border },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </Card>

        <View
          style={[
            styles.note,
            {
              backgroundColor: colors.card,
              borderColor: colors.accent + "55",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="info" size={16} color={colors.accent} />
          <Text
            style={[
              styles.noteText,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_500Medium",
                writingDirection: "rtl",
              },
            ]}
          >
            اللغة العربية مدعومة بالكامل حالياً. الترجمات الأخرى قيد التطوير
            وستتوفر قريباً.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    gap: 18,
  },
  intro: { gap: 6 },
  introTitle: {
    fontSize: 20,
    textAlign: "right",
  },
  introSub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  flag: {
    fontSize: 28,
  },
  rowText: { flex: 1, gap: 2 },
  langName: {
    fontSize: 15,
    textAlign: "right",
  },
  langSub: {
    fontSize: 11,
    textAlign: "right",
  },
  checkBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  note: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "right",
  },
});
