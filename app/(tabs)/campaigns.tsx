import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState } from "@/components/EmptyState";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useColors } from "@/hooks/useColors";
import type { Campaign } from "@/data/seed";

const isWeb = Platform.OS === "web";

type FilterKey = "all" | "saved" | "urgent";

const filters: { key: FilterKey; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "all", label: "الكل", icon: "grid" },
  { key: "urgent", label: "عاجل", icon: "alert-circle" },
  { key: "saved", label: "المحفوظة", icon: "bookmark" },
];

export default function CampaignsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { campaigns, savedIds, loaded } = useCampaigns();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const filtered: Campaign[] =
    filter === "saved"
      ? campaigns.filter((c) => savedIds.includes(c.id))
      : filter === "urgent"
        ? campaigns.filter((c) => c.urgent)
        : campaigns;

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setTimeout(() => setRefreshing(false), 800);
  };

  const headerTopPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: headerTopPad + 16 }]}>
        <Text
          style={[
            styles.title,
            {
              color: colors.foreground,
              fontFamily: "Inter_700Bold",
              writingDirection: "rtl",
              textAlign: "right",
            },
          ]}
        >
          الحملات
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              writingDirection: "rtl",
              textAlign: "right",
            },
          ]}
        >
          {filtered.length} حملة • محفوظ للوصول دون اتصال
        </Text>

        <View style={styles.filterRow}>
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync().catch(() => {});
                  }
                  setFilter(f.key);
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather
                  name={f.icon}
                  size={13}
                  color={active ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: active
                        ? colors.primaryForeground
                        : colors.foreground,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: isWeb ? 84 + 24 : 100 + insets.bottom,
          },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item }) => <CampaignCard campaign={item} />}
        ListEmptyComponent={
          loaded ? (
            <EmptyState
              iconName={filter === "saved" ? "bookmark" : "inbox"}
              title={
                filter === "saved"
                  ? "لا توجد حملات محفوظة"
                  : "لا توجد حملات حالياً"
              }
              subtitle={
                filter === "saved"
                  ? "احفظ الحملات لتصل إليها بسهولة لاحقاً، حتى دون اتصال بالإنترنت."
                  : "تحقق لاحقاً من الحملات الجديدة."
              }
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        scrollEnabled={filtered.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
});
