import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  FlatList,
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
import { QuickAction } from "@/components/QuickAction";
import { SectionHeader } from "@/components/SectionHeader";
import { StatTile } from "@/components/StatTile";
import { seedStats } from "@/data/seed";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { campaigns, news, loaded } = useCampaigns();

  const featured = useMemo(() => campaigns.slice(0, 4), [campaigns]);
  const latestNews = useMemo(() => news.slice(0, 3), [news]);

  const headerTopPad = isWeb ? 67 : insets.top;

  const showSoon = (label: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    Alert.alert(label, "هذه الميزة ستكون متاحة في التحديث القادم.");
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
          <View style={styles.headerRow}>
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

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <QuickAction
              iconName="heart"
              label="تبرع"
              onPress={() => router.push("/campaigns")}
            />
            <QuickAction
              iconName="users"
              label="تطوع"
              onPress={() => showSoon("التطوع")}
            />
            <QuickAction
              iconName="share-2"
              label="شارك"
              onPress={() => showSoon("المشاركة")}
            />
            <QuickAction
              iconName="message-circle"
              label="تواصل"
              onPress={() => router.push("/chat")}
            />
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
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
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
  quickRow: {
    flexDirection: "row-reverse",
    gap: 12,
    paddingVertical: 4,
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
