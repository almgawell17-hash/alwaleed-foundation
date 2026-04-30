import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CampaignCard } from "@/components/CampaignCard";
import { Card } from "@/components/Card";
import { Logo } from "@/components/Logo";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { seedStats } from "@/data/seed";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

type MainAction = {
  key: string;
  label: string;
  sub: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: "/donate" | "/news" | "/contact";
  color: string;
};

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: "/settings" | "/language" | "/(tabs)/about";
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { campaigns, news, loaded } = useCampaigns();
  const [menuOpen, setMenuOpen] = useState(false);

  const featured = useMemo(() => campaigns.slice(0, 4), [campaigns]);
  const latestNews = useMemo(() => news.slice(0, 3), [news]);

  const headerTopPad = isWeb ? 67 : insets.top;

  const haptic = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const mainActions: MainAction[] = [
    {
      key: "donate",
      label: "تبرع الآن",
      sub: "ساهم في إنقاذ الأرواح",
      icon: "hand-heart",
      route: "/donate",
      color: colors.primary,
    },
    {
      key: "news",
      label: "آخر الأخبار",
      sub: "تابع جديد المؤسسة",
      icon: "newspaper-variant-outline",
      route: "/news",
      color: colors.accent,
    },
    {
      key: "contact",
      label: "تواصل معنا",
      sub: "نحن هنا لخدمتك",
      icon: "phone-in-talk",
      route: "/contact",
      color: "#7C5CFF",
    },
  ];

  const menuItems: MenuItem[] = [
    {
      key: "settings",
      label: "إعدادات التطبيق",
      icon: "cog-outline",
      route: "/settings",
    },
    {
      key: "language",
      label: "تغيير اللغة",
      icon: "translate",
      route: "/language",
    },
    {
      key: "about",
      label: "عن المؤسسة",
      icon: "information-outline",
      route: "/(tabs)/about",
    },
  ];

  const handleMenuPress = (route: MenuItem["route"]) => {
    haptic();
    setMenuOpen(false);
    router.push(route);
  };

  const handleActionPress = (route: MainAction["route"]) => {
    haptic();
    router.push(route);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (isWeb ? 84 + 24 : 100 + insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={["#0F1A20", "#0A1014"]}
          style={[
            styles.headerGradient,
            { paddingTop: headerTopPad + 16 },
          ]}
        >
          {/* Official brand banner */}
          <View style={styles.adBanner}>
            <Image
              source={require("@/assets/images/ad.png")}
              style={styles.adImage}
              resizeMode="contain"
              accessibilityLabel="مؤسسة الوليد للإنسانية"
            />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={() => {
                  haptic();
                  setMenuOpen(true);
                }}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.menuBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityLabel="القائمة"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={22}
                  color={colors.foreground}
                />
              </Pressable>
            </View>
            <View style={styles.headerTitleWrap}>
              <Text
                style={[
                  styles.welcome,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "Inter_500Medium",
                    writingDirection: "rtl",
                  },
                ]}
              >
                السلام عليكم
              </Text>
              <Text
                style={[
                  styles.brandName,
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
                  {
                    color: colors.primary,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                AlWaleed for Humanity
              </Text>
            </View>
            <Logo size={52} />
          </View>

          {/* Hero CTA */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: "rgba(212, 162, 76, 0.08)",
                borderColor: colors.primary + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.heroContent}>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    color: colors.foreground,
                    fontFamily: "Inter_700Bold",
                    writingDirection: "rtl",
                  },
                ]}
              >
                معاً من أجل الإنسانية
              </Text>
              <Text
                style={[
                  styles.heroSub,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                    writingDirection: "rtl",
                  },
                ]}
              >
                ادعم الحملات الإنسانية حول العالم وكن جزءاً من التغيير.
              </Text>
              <Pressable
                onPress={() => router.push("/campaigns")}
                style={({ pressed }) => [
                  styles.heroBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroBtnText,
                    {
                      color: colors.primaryForeground,
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                >
                  استكشف الحملات
                </Text>
                <Feather
                  name="arrow-left"
                  size={16}
                  color={colors.primaryForeground}
                />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Stats */}
          <View style={styles.statsRow}>
            {seedStats.map((s) => (
              <StatTile
                key={s.id}
                label={s.labelAr}
                value={s.value}
                iconName={s.iconName as keyof typeof Feather.glyphMap}
              />
            ))}
          </View>

          {/* Main action buttons */}
          <View style={styles.mainActions}>
            {mainActions.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => handleActionPress(a.route)}
                style={({ pressed }) => [
                  styles.mainActionBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: a.color + "55",
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                <View
                  style={[
                    styles.mainActionIcon,
                    { backgroundColor: a.color + "1F" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={a.icon}
                    size={26}
                    color={a.color}
                  />
                </View>
                <Text
                  style={[
                    styles.mainActionLabel,
                    {
                      color: colors.foreground,
                      fontFamily: "Inter_700Bold",
                      writingDirection: "rtl",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {a.label}
                </Text>
                <Text
                  style={[
                    styles.mainActionSub,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      writingDirection: "rtl",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {a.sub}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Featured campaigns */}
          <View style={styles.section}>
            <SectionHeader title="حملات مميزة" action="الكل" />
            <FlatList
              data={featured}
              keyExtractor={(item) => item.id}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <CampaignCard campaign={item} variant="horizontal" />
              )}
              scrollEnabled={featured.length > 0}
            />
          </View>

          {/* Latest news */}
          <View style={styles.section}>
            <SectionHeader title="آخر الأخبار" />
            <View style={styles.newsList}>
              {!loaded ? (
                <Card>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      textAlign: "center",
                    }}
                  >
                    جارٍ التحميل...
                  </Text>
                </Card>
              ) : (
                latestNews.map((n) => (
                  <Card key={n.id}>
                    <Text
                      style={[
                        styles.newsTitle,
                        {
                          color: colors.foreground,
                          fontFamily: "Inter_600SemiBold",
                          writingDirection: "rtl",
                          textAlign: "right",
                        },
                      ]}
                    >
                      {n.titleAr}
                    </Text>
                    <Text
                      style={[
                        styles.newsExcerpt,
                        {
                          color: colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                          writingDirection: "rtl",
                          textAlign: "right",
                        },
                      ]}
                    >
                      {n.excerptAr}
                    </Text>
                    <View style={styles.newsMeta}>
                      <Feather
                        name="calendar"
                        size={11}
                        color={colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.newsDate,
                          {
                            color: colors.mutedForeground,
                            fontFamily: "Inter_400Regular",
                          },
                        ]}
                      >
                        {n.date}
                      </Text>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </View>

          {/* Offline indicator */}
          <View
            style={[
              styles.offlineNote,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="download-cloud" size={16} color={colors.accent} />
            <Text
              style={[
                styles.offlineText,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  writingDirection: "rtl",
                },
              ]}
            >
              المحتوى محفوظ ومتاح للعرض دون اتصال بالإنترنت
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 3-dot menu modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.menuSheet,
              {
                top: headerTopPad + 56,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text
              style={[
                styles.menuTitle,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  writingDirection: "rtl",
                },
              ]}
            >
              القائمة
            </Text>
            {menuItems.map((item, idx) => (
              <Pressable
                key={item.key}
                onPress={() => handleMenuPress(item.route)}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    borderTopColor: colors.border,
                    borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                    backgroundColor: pressed
                      ? colors.secondary
                      : "transparent",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text
                  style={[
                    styles.menuLabel,
                    {
                      color: colors.foreground,
                      fontFamily: "Inter_500Medium",
                      writingDirection: "rtl",
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  adBanner: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 16,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  adImage: {
    width: 240,
    aspectRatio: 560 / 346,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  headerLeft: {
    width: 40,
    alignItems: "flex-start",
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  welcome: {
    fontSize: 13,
  },
  brandName: {
    fontSize: 20,
    lineHeight: 26,
  },
  brandEn: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  heroCard: {
    borderWidth: 1,
    padding: 18,
  },
  heroContent: {
    gap: 8,
    alignItems: "flex-end",
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: "right",
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "right",
  },
  heroBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-end",
  },
  heroBtnText: {
    fontSize: 14,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  statsRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  mainActions: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  mainActionBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 8,
    minHeight: 130,
  },
  mainActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionLabel: {
    fontSize: 13,
    textAlign: "center",
  },
  mainActionSub: {
    fontSize: 10,
    textAlign: "center",
    opacity: 0.85,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  menuSheet: {
    position: "absolute",
    left: 16,
    minWidth: 220,
    borderWidth: 1,
    paddingVertical: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  menuTitle: {
    fontSize: 11,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    textAlign: "right",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    flex: 1,
    textAlign: "right",
  },
  section: {
    gap: 4,
  },
  horizontalList: {
    paddingVertical: 4,
  },
  newsList: {
    gap: 10,
  },
  newsTitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  newsExcerpt: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  newsMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  newsDate: {
    fontSize: 11,
  },
  offlineNote: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
  },
  offlineText: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
});
