import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
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
import { useCampaigns } from "@/hooks/useCampaigns";
import { useColors } from "@/hooks/useColors";

const PRESETS = [100, 250, 500, 1000, 10000];

const PAYMENT_METHODS = [
  { key: "apple", labelAr: "Apple Pay", icon: "apple" as const },
  { key: "card", labelAr: "بطاقة ائتمان", icon: "credit-card" as const },
  { key: "mada", labelAr: "مدى", icon: "credit-card-outline" as const },
  { key: "bank", labelAr: "تحويل بنكي", icon: "bank-outline" as const },
];

export default function DonateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { campaigns } = useCampaigns();

  const [preset, setPreset] = useState<number>(100);
  const [custom, setCustom] = useState("");
  const [campaignId, setCampaignId] = useState<string>("general");
  const [method, setMethod] = useState<string>("apple");

  const finalAmount = custom ? Number(custom) : preset;

  const onConfirm = () => {
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert(
        "مبلغ غير صحيح",
        "الرجاء اختيار أو إدخال مبلغ صالح للتبرع.",
      );
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    Alert.alert(
      "شكراً لتبرعك",
      `سيتم توجيهك إلى صفحة الدفع الآمن لإكمال التبرع بمبلغ ${finalAmount} ريال سعودي.`,
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
        {/* Hero */}
        <LinearGradient
          colors={["rgba(212,162,76,0.18)", "rgba(212,162,76,0.04)"]}
          style={[styles.hero, { borderRadius: colors.radius }]}
        >
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <MaterialCommunityIcons
              name="hand-heart"
              size={32}
              color={colors.primary}
            />
          </View>
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
            ساهم في إنقاذ الأرواح
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
            تبرعك يوصل الغذاء، الماء، والدواء إلى المحتاجين حول العالم.
          </Text>
        </LinearGradient>

        {/* Amount selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            اختر المبلغ
          </Text>
          <View style={styles.presetGrid}>
            {PRESETS.map((p) => {
              const selected = !custom && preset === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    setPreset(p);
                    setCustom("");
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync().catch(() => {});
                    }
                  }}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.card,
                      borderColor: selected
                        ? colors.primary
                        : colors.border,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetAmount,
                      {
                        color: selected
                          ? colors.primaryForeground
                          : colors.foreground,
                        fontFamily: "Inter_700Bold",
                      },
                    ]}
                  >
                    {p}
                  </Text>
                  <Text
                    style={[
                      styles.presetCurrency,
                      {
                        color: selected
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    ريال
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Card style={styles.customWrap}>
            <Text
              style={[
                styles.customLabel,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  writingDirection: "rtl",
                },
              ]}
            >
              أو أدخل مبلغاً مخصصاً
            </Text>
            <View
              style={[
                styles.customInputRow,
                { borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.customCurrency,
                  {
                    color: colors.primary,
                    fontFamily: "Inter_700Bold",
                  },
                ]}
              >
                ر.س
              </Text>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.customInput,
                  {
                    color: colors.foreground,
                    fontFamily: "Inter_700Bold",
                  },
                ]}
              />
            </View>
          </Card>
        </View>

        {/* Campaign picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            اختر الحملة
          </Text>
          <View style={styles.campaignList}>
            <Pressable
              onPress={() => setCampaignId("general")}
              style={({ pressed }) => [
                styles.campaignRow,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    campaignId === "general"
                      ? colors.primary
                      : colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.campaignRowText}>
                <Text
                  style={[
                    styles.campaignTitle,
                    {
                      color: colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                      writingDirection: "rtl",
                    },
                  ]}
                >
                  الصندوق العام
                </Text>
                <Text
                  style={[
                    styles.campaignSub,
                    {
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      writingDirection: "rtl",
                    },
                  ]}
                >
                  يوزع على الحملات الأكثر احتياجاً
                </Text>
              </View>
              <Feather
                name={
                  campaignId === "general" ? "check-circle" : "circle"
                }
                size={20}
                color={
                  campaignId === "general"
                    ? colors.primary
                    : colors.mutedForeground
                }
              />
            </Pressable>
            {campaigns.slice(0, 4).map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCampaignId(c.id)}
                style={({ pressed }) => [
                  styles.campaignRow,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      campaignId === c.id ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.campaignRowText}>
                  <Text
                    style={[
                      styles.campaignTitle,
                      {
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        writingDirection: "rtl",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {c.titleAr}
                  </Text>
                  <Text
                    style={[
                      styles.campaignSub,
                      {
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                        writingDirection: "rtl",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {c.location}
                  </Text>
                </View>
                <Feather
                  name={campaignId === c.id ? "check-circle" : "circle"}
                  size={20}
                  color={
                    campaignId === c.id
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            طريقة الدفع
          </Text>
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map((m) => {
              const selected = method === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMethod(m.key)}
                  style={({ pressed }) => [
                    styles.paymentBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: selected
                        ? colors.primary
                        : colors.border,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={24}
                    color={selected ? colors.primary : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.paymentLabel,
                      {
                        color: colors.foreground,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {m.labelAr}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Confirm */}
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather
            name="lock"
            size={16}
            color={colors.primaryForeground}
          />
          <Text
            style={[
              styles.confirmText,
              {
                color: colors.primaryForeground,
                fontFamily: "Inter_700Bold",
              },
            ]}
          >
            تبرع بمبلغ {finalAmount || 0} ريال
          </Text>
        </Pressable>

        <View style={styles.secureNote}>
          <Feather name="shield" size={13} color={colors.accent} />
          <Text
            style={[
              styles.secureText,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                writingDirection: "rtl",
              },
            ]}
          >
            عملية الدفع مشفرة بالكامل وآمنة
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
    gap: 24,
  },
  hero: {
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    writingDirection: "rtl",
    textAlign: "right",
  },
  presetGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
  },
  presetBtn: {
    flexBasis: "30%",
    flexGrow: 1,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
    gap: 2,
  },
  presetAmount: {
    fontSize: 20,
  },
  presetCurrency: {
    fontSize: 11,
  },
  customWrap: {
    gap: 8,
  },
  customLabel: {
    fontSize: 12,
    textAlign: "right",
  },
  customInputRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 6,
    gap: 8,
  },
  customCurrency: {
    fontSize: 14,
  },
  customInput: {
    flex: 1,
    fontSize: 22,
    textAlign: "right",
    paddingVertical: 4,
  },
  campaignList: {
    gap: 8,
  },
  campaignRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  campaignRowText: {
    flex: 1,
    gap: 2,
  },
  campaignTitle: {
    fontSize: 14,
    textAlign: "right",
  },
  campaignSub: {
    fontSize: 11,
    textAlign: "right",
  },
  paymentGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
  },
  paymentBtn: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  paymentLabel: {
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  confirmBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  confirmText: {
    fontSize: 16,
  },
  secureNote: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: -8,
  },
  secureText: {
    fontSize: 11,
  },
});
