import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  value: string;
  iconName: keyof typeof Feather.glyphMap;
};

export function StatTile({ label, value, iconName }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.primary + "1A" },
        ]}
      >
        <Feather name={iconName} size={18} color={colors.primary} />
      </View>
      <Text
        style={[
          styles.value,
          {
            color: colors.foreground,
            fontFamily: "Inter_700Bold",
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: colors.mutedForeground,
            fontFamily: "Inter_500Medium",
            writingDirection: "rtl",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 22,
    lineHeight: 26,
  },
  label: {
    fontSize: 12,
  },
});
