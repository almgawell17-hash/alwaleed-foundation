import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef } from "react";
import {
  ActionSheetIOS,
  Alert,
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
import { useChat, type ChatMessage, type SendMediaPayload } from "@/hooks/useChat";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";
const isIOS = Platform.OS === "ios";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, isAgentTyping, send, clear } = useChat();

  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordingRef = useRef<{ recording: import("expo-av").Audio.Recording; timer: ReturnType<typeof setInterval> } | null>(null);

  const headerTopPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 84 + 8 : insets.bottom + 8;
  const reversed: ChatMessage[] = [...messages].reverse();

  const haptic = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    haptic();
    setInput("");
    send(text);
  };

  // ── Media Attachment ─────────────────────────────────────────────────────

  const pickImage = async (type: "image" | "video") => {
    try {
      if (!isWeb) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى المعرض.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === "video" ? ["videos"] : ["images"],
        quality: 0.75,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const media: SendMediaPayload = {
          uri: asset.uri,
          type,
          name: asset.fileName ?? `${type}-${Date.now()}`,
        };
        haptic();
        send("", media);
      }
    } catch {
      Alert.alert("خطأ", "تعذر اختيار الوسائط.");
    }
  };

  const pickFile = async () => {
    // File picking via image picker (documents not supported on all platforms)
    await pickImage("image");
  };

  const showAttachMenu = () => {
    haptic();
    if (isIOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["إلغاء", "صورة من المعرض", "فيديو", "ملف"],
          cancelButtonIndex: 0,
          title: "إرفاق وسائط",
        },
        (i) => {
          if (i === 1) pickImage("image");
          else if (i === 2) pickImage("video");
          else if (i === 3) pickFile();
        },
      );
    } else {
      Alert.alert("إرفاق وسائط", undefined, [
        { text: "صورة من المعرض", onPress: () => pickImage("image") },
        { text: "فيديو", onPress: () => pickImage("video") },
        { text: "ملف", onPress: () => pickFile() },
        { text: "إلغاء", style: "cancel" },
      ]);
    }
  };

  // ── Voice Recording ──────────────────────────────────────────────────────

  const startRecording = async () => {
    if (isWeb) {
      Alert.alert("غير متاح", "التسجيل الصوتي غير متاح على المتصفح.");
      return;
    }
    try {
      const { Audio } = await import("expo-av");
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى الميكروفون.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        setRecordDuration(seconds);
        if (seconds >= 120) stopRecording(); // max 2 min
      }, 1000);
      recordingRef.current = { recording: rec, timer };
      setRecording(true);
      setRecordDuration(0);
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {
      Alert.alert("خطأ", "تعذر بدء التسجيل الصوتي.");
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    const { recording: rec, timer } = recordingRef.current;
    clearInterval(timer);
    recordingRef.current = null;
    setRecording(false);

    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (uri) {
        const status = await rec.getStatusAsync();
        const durationMs = status.isLoaded ? status.durationMillis ?? 0 : recordDuration * 1000;
        haptic();
        send("", { uri, type: "voice", name: `voice-${Date.now()}.m4a`, durationMs });
      }
    } catch {
      Alert.alert("خطأ", "تعذر حفظ التسجيل الصوتي.");
    }
    setRecordDuration(0);
  };

  const handleMicPress = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatRecordTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerStatusRow}>
            <View style={[styles.onlineDot, { backgroundColor: colors.accent }]} />
            <Text
              style={[
                styles.headerStatus,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
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

      <KeyboardAvoidingView behavior="padding" style={styles.kavWrap} keyboardVerticalOffset={0}>
        <FlatList
          data={reversed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          inverted
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={isAgentTyping ? <TypingIndicator /> : null}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
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
          {recording ? (
            /* Recording indicator */
            <View style={styles.recordingRow}>
              <Pressable
                onPress={stopRecording}
                style={[styles.recordStopBtn, { backgroundColor: "#E5484D" }]}
              >
                <MaterialCommunityIcons name="stop" size={18} color="#fff" />
              </Pressable>

              <View style={styles.recordingIndicator}>
                <View style={[styles.recordDot, { backgroundColor: "#E5484D" }]} />
                <Text
                  style={[
                    styles.recordTime,
                    { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
                  ]}
                >
                  {formatRecordTime(recordDuration)}
                </Text>
                <Text
                  style={[
                    styles.recordLabel,
                    { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                  ]}
                >
                  جارٍ التسجيل...
                </Text>
              </View>
            </View>
          ) : (
            /* Normal input row */
            <>
              {/* Send button */}
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
                  color={input.trim() ? colors.primaryForeground : colors.mutedForeground}
                />
              </Pressable>

              {/* Text input */}
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

              {/* Mic button */}
              <Pressable
                onPress={handleMicPress}
                style={({ pressed }) => [
                  styles.mediaBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="mic" size={18} color={colors.mutedForeground} />
              </Pressable>

              {/* Attach button */}
              <Pressable
                onPress={showAttachMenu}
                style={({ pressed }) => [
                  styles.mediaBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="paperclip" size={18} color={colors.mutedForeground} />
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerCenter: { flex: 1, alignItems: "flex-end", gap: 2 },
  headerTitle: { fontSize: 16 },
  headerStatusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerStatus: { fontSize: 11 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  kavWrap: { flex: 1 },
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
  mediaBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  // Recording state
  recordingRow: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  recordStopBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
  recordTime: {
    fontSize: 18,
    letterSpacing: 1,
  },
  recordLabel: {
    fontSize: 12,
  },
});
