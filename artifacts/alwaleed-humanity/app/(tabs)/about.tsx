import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { Logo } from "@/components/Logo";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

const values: {
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  desc: string;
}[] = [
  {
    iconName: "compass",
    title: "رؤيتنا",
    desc: "عالم تتاح فيه الكرامة والفرصة لكل إنسان، بغض النظر عن الجغرافيا أو الظروف.",
  },
  {
    iconName: "target",
    title: "رسالتنا",
    desc: "تقديم المساعدات الإنسانية وتمكين المجتمعات الأكثر احتياجاً عبر برامج مستدامة.",
  },
  {
    iconName: "shield",
    title: "قيمنا",
    desc: "الشفافية، الاحترافية، الأثر القابل للقياس، والكرامة الإنسانية في كل ما نقوم به.",
  },
];

const contacts: {
  iconName: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  action: () => void;
}[] = [
  {
    iconName: "mail",
    label: "البريد الإلكتروني",
    value: "contact@alwaleed-humanity.org",
    action: () => Linking.openURL("mailto:contact@alwaleed-humanity.org"),
  },
  {
    iconName: "phone",
    label: "الهاتف",
    value: "+966 11 211 1234",
    action: () => Linking.openURL("tel:+966112111234"),
  },
  {
    iconName: "globe",
    label: "الموقع الإلكتروني",
    value: "alwaleed-humanity.org",
    action: () =>
      WebBrowser.openBrowserAsync("https://alwaleed-humanity.org").catch(
        () => {},
      ),
  },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const headerTopPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerTopPad + 16,
            paddingBottom: isWeb ? 84 + 24 : 100 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand block */}
        <View style={styles.brandBlock}>
          <Logo size={72} />
          <Text
            style={[
              styles.brandAr,
              {
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                writingDirection: "rtl",
              },
            ]}
          >
            مؤسسة الوليد للإنسانية
          </Text>
          <Text
            style={[
              styles.brandEn,
              { color: colors.primary, fontFamily: "Inter_500Medium" },
            ]}
          >
            AlWaleed for Humanity
          </Text>
          <Text
            style={[
              styles.tagline,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                writingDirection: "rtl",
              },
            ]}
          >
            مؤسسة عالمية مكرسة لخدمة الإنسانية منذ عام 1980
          </Text>
        </View>

        {/* About paragraph */}
        <Card>
          <Text
            style={[
              styles.aboutText,
              {
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
                writingDirection: "rtl",
                textAlign: "right",
              },
            ]}
          >
            نحن مؤسسة إنسانية غير ربحية تعمل في أكثر من ثلاثين دولة حول العالم.
            نقدم برامج إغاثة عاجلة وتنمية مستدامة للأسر والمجتمعات الأكثر
            احتياجاً، مع التركيز على الإغاثة، التعليم، الصحة، وتمكين المرأة
            والشباب.
          </Text>
        </Card>

        {/* Values cards */}
        <View style={styles.section}>
          {values.map((v) => (
            <Card key={v.title}>
              <View style={styles.valueRow}>
                <View style={styles.valueText}>
                  <Text
                    style={[
                      styles.valueTitle,
                      {
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        writingDirection: "rtl",
                        textAlign: "right",
                      },
                    ]}
                  >
                    {v.title}
                  </Text>
                  <Text
                    style={[
                      styles.valueDesc,
                      {
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                        writingDirection: "rtl",
                        textAlign: "right",
                      },
                    ]}
                  >
                    {v.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.valueIcon,
                    { backgroundColor: colors.primary + "1A" },
                  ]}
                >
                  <Feather
                    name={v.iconName}
                    size={20}
                    color={colors.primary}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Contact */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
              writingDirection: "rtl",
            },
          ]}
        >
          تواصل معنا
        </Text>

        <View style={styles.section}>
          {contacts.map((c) => (
            <Pressable
              key={c.label}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync().catch(() => {});
                }
                c.action();
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <Card>
                <View style={styles.contactRow}>
                  <Feather
                    name="chevron-left"
                    size={18}
                    color={colors.mutedForeground}
                  />
                  <View style={styles.contactText}>
                    <Text
                      style={[
                        styles.contactLabel,
                        {
                          color: colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          writingDirection: "rtl",
                          textAlign: "right",
                        },
                      ]}
                    >
                      {c.label}
                    </Text>
                    <Text
                      style={[
                        styles.contactValue,
                        {
                          color: colors.foreground,
                          fontFamily: "Inter_500Medium",
                          textAlign: "right",
                        },
                      ]}
                    >
                      {c.value}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.contactIcon,
                      { backgroundColor: colors.accent + "1A" },
                    ]}
                  >
                    <Feather
                      name={c.iconName}
                      size={18}
                      color={colors.accent}
                    />
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        <Text
          style={[
            styles.footerText,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          v1.0.0 • © 2026 AlWaleed for Humanity
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  brandBlock: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  brandAr: {
    fontSize: 22,
    marginTop: 8,
  },
  brandEn: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  tagline: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 320,
    lineHeight: 19,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    textAlign: "right",
    marginTop: 4,
  },
  valueRow: {
    flexDirection: "row-reverse",
    gap: 12,
    alignItems: "flex-start",
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    flex: 1,
    gap: 4,
  },
  valueTitle: {
    fontSize: 15,
  },
  valueDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  contactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 11,
  },
  contactValue: {
    fontSize: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
    opacity: 0.6,
  },
});
