import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ChatMessage } from "@/hooks/useChat";

type Props = {
  message: ChatMessage;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function ChatBubble({ message }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: isUser ? colors.primary : colors.border,
            borderTopRightRadius: isUser ? 4 : 18,
            borderTopLeftRadius: isUser ? 18 : 4,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser ? colors.primaryForeground : colors.foreground,
              fontFamily: "Inter_500Medium",
              writingDirection: "rtl",
              textAlign: "right",
            },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.time,
            {
              color: isUser
                ? colors.primaryForeground
                : colors.mutedForeground,
              opacity: isUser ? 0.7 : 1,
              fontFamily: "Inter_400Regular",
            },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  const colors = useColors();
  return (
    <View style={[styles.row, { justifyContent: "flex-start" }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderTopLeftRadius: 4,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  time: {
    fontSize: 10,
    alignSelf: "flex-end",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
});
