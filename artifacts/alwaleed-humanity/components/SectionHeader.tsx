import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  action?: string;
};

export function SectionHeader({ title, action }: Props) {
  const colors = useColors();
  return (
    <View style={styles.row}>
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
        {title}
      </Text>
      {action ? (
        <Text
          style={[
            styles.action,
            {
              color: colors.primary,
              fontFamily: "Inter_500Medium",
              writingDirection: "rtl",
            },
          ]}
        >
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
  },
  action: {
    fontSize: 13,
  },
});
