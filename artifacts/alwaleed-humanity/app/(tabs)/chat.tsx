import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, isAgentTyping, send, clear } = useChat();
  const [input, setInput] = useState<string>("");

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setInput("");
    send(text);
  };

  const headerTopPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 84 + 8 : insets.bottom + 8;

  // Inverted FlatList — reverse the data
  const reversed: ChatMessage[] = [...messages].reverse();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: headerTopPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={clear}
          hitSlop={10}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerStatusRow}>
            <View
              style={[styles.onlineDot, { backgroundColor: colors.accent }]}
            />
            <Text
              style={[
                styles.headerStatus,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                },
              ]}
            >
              متصل الآن
            </Text>
          </View>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.foreground,
                fontFamily: "Inter_600SemiBold",
                writingDirection: "rtl",
              },
            ]}
          >
            الدعم الفني
          </Text>
        </View>

        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.primary + "26",
              borderColor: colors.primary + "60",
            },
          ]}
        >
          <Feather name="headphones" size={18} color={colors.primary} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.kavWrap}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={reversed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          inverted
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={isAgentTyping ? <TypingIndicator /> : null}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          scrollEnabled={reversed.length > 0}
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomPad,
            },
          ]}
        >
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: input.trim() ? colors.primary : colors.secondary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name="arrow-up"
              size={20}
              color={
                input.trim() ? colors.primaryForeground : colors.mutedForeground
              }
            />
          </Pressable>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                fontFamily: "Inter_400Regular",
                writingDirection: "rtl",
                textAlign: "right",
              },
            ]}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
  },
  headerStatusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  headerStatus: {
    fontSize: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  kavWrap: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  inputBar: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 21,
    borderWidth: 1,
  },
});
