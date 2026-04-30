import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "@alwaleed/settings/v1";

type SettingsState = {
  notificationsPush: boolean;
  notificationsEmail: boolean;
  soundEffects: boolean;
  haptics: boolean;
  dataSaver: boolean;
};

const DEFAULTS: SettingsState = {
  notificationsPush: true,
  notificationsEmail: false,
  soundEffects: true,
  haptics: true,
  dataSaver: false,
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<SettingsState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setState({ ...DEFAULTS, ...JSON.parse(raw) });
          } catch {}
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }
  }, [state, loaded]);

  const toggle = (key: keyof SettingsState) => {
    if (Platform.OS !== "web" && state.haptics) {
      Haptics.selectionAsync().catch(() => {});
    }
    setState((s) => ({ ...s, [key]: !s[key] }));
  };

  const clearCache = () => {
    Alert.alert(
      "مسح الذاكرة المؤقتة",
      "سيؤدي هذا إلى حذف البيانات المحفوظة محلياً (لن يؤثر على حسابك). هل أنت متأكد؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "مسح",
          style: "destructive",
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const toRemove = keys.filter((k) =>
                k.startsWith("@alwaleed/"),
              );
              await AsyncStorage.multiRemove(
                toRemove.filter((k) => k !== STORAGE_KEY),
              );
              Alert.alert("تم", "تم مسح الذاكرة المؤقتة بنجاح.");
            } catch {
              Alert.alert("خطأ", "حدث خطأ أثناء مسح الذاكرة المؤقتة.");
            }
          },
        },
      ],
    );
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
        <Section title="الإشعارات">
          <SettingRow
            icon="bell-outline"
            label="الإشعارات الفورية"
            sub="تلقي إشعارات الحملات الجديدة والتحديثات"
            control={
              <Switch
                value={state.notificationsPush}
                onValueChange={() => toggle("notificationsPush")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Divider />
          <SettingRow
            icon="email-outline"
            label="إشعارات البريد"
            sub="تلقي ملخصات أسبوعية عبر البريد الإلكتروني"
            control={
              <Switch
                value={state.notificationsEmail}
                onValueChange={() => toggle("notificationsEmail")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Section>

        <Section title="التجربة">
          <SettingRow
            icon="volume-high"
            label="المؤثرات الصوتية"
            sub="تشغيل أصوات التفاعل"
            control={
              <Switch
                value={state.soundEffects}
                onValueChange={() => toggle("soundEffects")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Divider />
          <SettingRow
            icon="vibrate"
            label="الاهتزاز"
            sub="تفعيل الاهتزاز عند التفاعل"
            control={
              <Switch
                value={state.haptics}
                onValueChange={() => toggle("haptics")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Divider />
          <SettingRow
            icon="cloud-download-outline"
            label="موفر البيانات"
            sub="تقليل استهلاك الإنترنت قدر الإمكان"
            control={
              <Switch
                value={state.dataSaver}
                onValueChange={() => toggle("dataSaver")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Section>

        <Section title="المظهر">
          <View style={styles.themeRow}>
            <View
              style={[
                styles.themeBadge,
                {
                  backgroundColor: colors.primary + "1F",
                  borderColor: colors.primary,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="weather-night"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.themeBadgeText,
                  { color: colors.primary, fontFamily: "Inter_700Bold" },
                ]}
              >
                داكن
              </Text>
            </View>
            <Text
              style={[
                styles.themeNote,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                  writingDirection: "rtl",
                },
              ]}
            >
              تم تحسين التطبيق للوضع الداكن لراحة العين.
            </Text>
          </View>
        </Section>

        <Section title="البيانات والتخزين">
          <Pressable
            onPress={clearCache}
            style={({ pressed }) => [
              styles.actionRow,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: colors.destructive + "1F" },
              ]}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={colors.destructive}
              />
            </View>
            <View style={styles.rowText}>
              <Text
                style={[
                  styles.rowLabel,
                  {
                    color: colors.destructive,
                    fontFamily: "Inter_600SemiBold",
                    writingDirection: "rtl",
                  },
                ]}
              >
                مسح الذاكرة المؤقتة
              </Text>
              <Text
                style={[
                  styles.rowSub,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                    writingDirection: "rtl",
                  },
                ]}
              >
                حذف البيانات المحفوظة لتحرير المساحة
              </Text>
            </View>
            <Feather
              name="chevron-left"
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        </Section>

        <Card style={{ alignItems: "center", gap: 4 }}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_500Medium",
              fontSize: 12,
            }}
          >
            الإصدار 1.0.0
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 11,
            }}
          >
            © 2026 مؤسسة الوليد للإنسانية
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.mutedForeground,
            fontFamily: "Inter_500Medium",
            writingDirection: "rtl",
          },
        ]}
      >
        {title}
      </Text>
      <Card padded={false} style={{ overflow: "hidden" }}>
        {children}
      </Card>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  sub,
  control,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  sub: string;
  control: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.actionRow}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.primary + "1F" },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: colors.foreground,
              fontFamily: "Inter_600SemiBold",
              writingDirection: "rtl",
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.rowSub,
            {
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              writingDirection: "rtl",
            },
          ]}
        >
          {sub}
        </Text>
      </View>
      {control}
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginHorizontal: 16,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    gap: 22,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: {
    fontSize: 14,
    textAlign: "right",
  },
  rowSub: {
    fontSize: 11,
    textAlign: "right",
  },
  themeRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    alignItems: "flex-end",
  },
  themeBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  themeBadgeText: {
    fontSize: 13,
  },
  themeNote: {
    fontSize: 12,
    textAlign: "right",
  },
});
