import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  iconName: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
};

export function QuickAction({ iconName, label, onPress }: Props) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.wrap,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name={iconName} size={22} color={colors.primary} />
      </View>
      <Text
        style={[
          styles.label,
          {
            color: colors.foreground,
            fontFamily: "Inter_500Medium",
            writingDirection: "rtl",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    textAlign: "center",
  },
});
