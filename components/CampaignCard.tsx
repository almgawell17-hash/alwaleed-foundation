import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { Campaign } from "@/data/seed";

const categoryGradients: Record<Campaign["category"], readonly [string, string]> = {
  food: ["#7C2D12", "#C2410C"] as const,
  shelter: ["#0E4A48", "#0E8388"] as const,
  education: ["#3B0764", "#7C3AED"] as const,
  health: ["#7F1D1D", "#DC2626"] as const,
  water: ["#0C4A6E", "#0284C7"] as const,
};

const categoryIcons: Record<Campaign["category"], keyof typeof Feather.glyphMap> = {
  food: "shopping-bag",
  shelter: "home",
  education: "book-open",
  health: "activity",
  water: "droplet",
};

type Props = {
  campaign: Campaign;
  variant?: "wide" | "horizontal";
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function CampaignCard({ campaign, variant = "wide" }: Props) {
  const colors = useColors();
  const { isSaved, toggleSave } = useCampaigns();
  const saved = isSaved(campaign.id);
  const progress = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

  const gradient = categoryGradients[campaign.category];
  const iconName = categoryIcons[campaign.category];

  const isHorizontal = variant === "horizontal";

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          width: isHorizontal ? 280 : "100%",
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.imageHeader,
          { borderTopLeftRadius: colors.radius, borderTopRightRadius: colors.radius },
        ]}
      >
        <View style={styles.imageHeaderRow}>
          <View style={styles.iconChip}>
            <Feather name={iconName} size={20} color="#FFFFFF" />
          </View>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.selectionAsync().catch(() => {});
              }
              toggleSave(campaign.id);
            }}
            hitSlop={10}
            style={styles.saveBtn}
          >
            <Feather
              name={saved ? "bookmark" : "bookmark"}
              size={18}
              color="#FFFFFF"
              style={{ opacity: saved ? 1 : 0.7 }}
            />
          </Pressable>
        </View>

        {campaign.urgent ? (
          <View style={styles.urgentBadge}>
            <Feather name="alert-circle" size={11} color="#FFFFFF" />
            <Text style={styles.urgentText}>عاجل</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <Text
          numberOfLines={1}
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
          {campaign.titleAr}
        </Text>

        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text
            numberOfLines={1}
            style={[
              styles.location,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              },
            ]}
          >
            {campaign.location}
          </Text>
        </View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.secondary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.footerRow}>
          <Text
            style={[
              styles.raised,
              { color: colors.primary, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            {progress}%
          </Text>
          <Text
            style={[
              styles.goal,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            ${formatNumber(campaign.raised)} / ${formatNumber(campaign.goal)}
          </Text>
        </View>

        <View style={styles.beneficiaryRow}>
          <Feather name="users" size={12} color={colors.accent} />
          <Text
            style={[
              styles.beneficiary,
              { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
            ]}
          >
            {formatNumber(campaign.beneficiaries)} مستفيد
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    overflow: "hidden",
  },
  imageHeader: {
    height: 90,
    padding: 12,
    justifyContent: "space-between",
  },
  imageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  urgentText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  body: {
    padding: 14,
    gap: 8,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  raised: {
    fontSize: 14,
  },
  goal: {
    fontSize: 11,
  },
  beneficiaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  beneficiary: {
    fontSize: 11,
  },
});
