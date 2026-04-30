import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import type { NewsItem } from "@/data/seed";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useColors } from "@/hooks/useColors";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function NewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { news, loaded } = useCampaigns();

  const renderItem = ({ item, index }: { item: NewsItem; index: number }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary + "33", colors.accent + "22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cover, { borderRadius: colors.radius }]}
      >
        <View
          style={[
            styles.coverBadge,
            { backgroundColor: "rgba(0,0,0,0.45)" },
          ]}
        >
          <Text
            style={[
              styles.coverBadgeText,
              { color: colors.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            #{String(index + 1).padStart(2, "0")}
          </Text>
        </View>
        <Feather
          name="image"
          size={42}
          color={colors.primary + "55"}
          style={styles.coverIcon}
        />
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <Feather name="calendar" size={12} color={colors.accent} />
          <Text
            style={[
              styles.date,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_500Medium",
              },
            ]}
          >
            {formatDate(item.date)}
          </Text>
        </View>
        <Text
          style={[
            styles.title,
            {
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
              writingDirection: "rtl",
            },
          ]}
        >
          {item.titleAr}
        </Text>
        <Text
          style={[
            styles.excerpt,
            {
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              writingDirection: "rtl",
            },
          ]}
        >
          {item.excerptAr}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.readMore,
            {
              borderColor: colors.primary + "55",
              borderRadius: 10,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={14} color={colors.primary} />
          <Text
            style={[
              styles.readMoreText,
              {
                color: colors.primary,
                fontFamily: "Inter_600SemiBold",
              },
            ]}
          >
            اقرأ المزيد
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={news}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 32 + insets.bottom },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.foreground,
                  fontFamily: "Inter_700Bold",
                  writingDirection: "rtl",
                },
              ]}
            >
              تغطية مستمرة لجهودنا
            </Text>
            <Text
              style={[
                styles.headerSub,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                  writingDirection: "rtl",
                },
              ]}
            >
              اطلع على أحدث الأخبار والتقارير من ميدان العمل الإنساني.
            </Text>
          </View>
        }
        ListEmptyComponent={
          loaded ? (
            <EmptyState
              iconName="file-text"
              title="لا توجد أخبار حالياً"
              subtitle="ستظهر آخر التحديثات والأخبار هنا فور توفرها."
            />
          ) : (
            <View style={{ padding: 24 }}>
              <Text
                style={{
                  color: colors.mutedForeground,
                  textAlign: "center",
                  fontFamily: "Inter_400Regular",
                }}
              >
                جارٍ التحميل...
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 18,
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    textAlign: "right",
  },
  headerSub: {
    fontSize: 13,
    textAlign: "right",
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  cover: {
    height: 110,
    margin: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverIcon: {
    opacity: 0.6,
  },
  coverBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverBadgeText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontSize: 11,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "right",
  },
  excerpt: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
  },
  readMore: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 12,
  },
});
