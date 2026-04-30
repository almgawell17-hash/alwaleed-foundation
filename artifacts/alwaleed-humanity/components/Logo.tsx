import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  size?: number;
};

export function Logo({ size = 44 }: Props) {
  const colors = useColors();
  return (
    <LinearGradient
      colors={["#D4A24C", "#B8862F"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
        },
      ]}
    >
      <View style={styles.inner}>
        <Feather name="heart" size={size * 0.5} color={colors.primaryForeground} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
});
