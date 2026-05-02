import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState, useRef } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthModal } from "@/components/AuthModal";
import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { useAuth } from "@/hooks/useAuth";
import { useChat, type ChatMessage, type SendMediaPayload } from "@/hooks/useChat";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";
const isIOS = Platform.OS === "ios";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, authDecided, loading: authLoading, signInWithGoogle, skipAuth, unlockAdmin } = useAuth();
  const { messages, isAgentTyping, send, clear } = useChat();

  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const recordingRef = useRef<{
    recording: import("expo-av").Audio.Recording;
    timer: ReturnType<typeof setInterval>;
  } | null>(null);

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

  const showAttachMenu = () => {
    haptic();
    if (isIOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["إلغاء", "صورة من المعرض", "فيديو"], cancelButtonIndex: 0, title: "إرفاق وسائط" },
        (i) => {
          if (i === 1) pickImage("image");
          else if (i === 2) pickImage("video");
        },
      );
    } else {
      Alert.alert("إرفاق وسائط", undefined, [
        { text: "صورة من المعرض", onPress: () => pickImage("image") },
        { text: "فيديو", onPress: () => pickImage("video") },
        { text: "إلغاء", style: "cancel" },
      ]);
    }
  };

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
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        setRecordDuration(seconds);
        if (seconds >= 120) stopRecording();
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
    if (recording) stopRecording();
    else startRecording();
  };

  const formatRecordTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleAdminLongPress = () => {
    if (user?.isAdmin) {
      router.push("/admin");
    } else {
      setAdminCode("");
      setAdminError("");
      setShowAdminModal(true);
    }
  };

  const submitAdminCode = () => {
    if (unlockAdmin(adminCode)) {
      setShowAdminModal(false);
      router.push("/admin");
    } else {
      setAdminError("رمز الوصول غير صحيح");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthModal
        visible={!authLoading && !authDecided}
        onGoogleSignIn={signInWithGoogle}
        onSkip={skipAuth}
      />

      <Modal
        visible={showAdminModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAdminModal(false)}
        >
          <Pressable
            style={[
              styles.adminCodeSheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.adminCodeHeader}>
              <Feather name="shield" size={22} color={colors.primary} />
              <Text
                style={[
                  styles.adminCodeTitle,
                  { color: colors.foreground, fontFamily: "Inter_700Bold" },
                ]}
              >
                دخول الإدارة
              </Text>
            </View>

            <TextInput
              value={adminCode}
              onChangeText={(v) => { setAdminCode(v); setAdminError(""); }}
              placeholder="أدخل رمز الوصول..."
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoFocus
              style={[
                styles.adminCodeInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: adminError ? "#E5484D" : colors.border,
                  fontFamily: "Inter_400Regular",
                  textAlign: "right",
                },
              ]}
              onSubmitEditing={submitAdminCode}
              returnKeyType="done"
            />

            {adminError ? (
              <Text
                style={[styles.adminError, { color: "#E5484D", fontFamily: "Inter_400Regular" }]}
              >
                {adminError}
              </Text>
            ) : null}

            <View style={styles.adminCodeBtns}>
              <Pressable
                onPress={() => setShowAdminModal(false)}
                style={[styles.adminCancelBtn, { borderColor: colors.border }]}
              >
                <Text
                  style={[
                    styles.adminCancelText,
                    { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
                  ]}
                >
                  إلغاء
                </Text>
              </Pressable>
              <Pressable
                onPress={submitAdminCode}
                style={[styles.adminConfirmBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    styles.adminConfirmText,
                    { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" },
                  ]}
                >
                  دخول
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
              { color: colors.foreground, fontFamily: "Inter_600SemiBold", writingDirection: "rtl" },
            ]}
          >
            الدعم الفني
          </Text>
        </View>

        <Pressable
          onLongPress={handleAdminLongPress}
          delayLongPress={600}
          onPress={user?.isAdmin ? () => router.push("/admin") : undefined}
          hitSlop={6}
          style={({ pressed }) => [
            styles.avatar,
            {
              backgroundColor: user?.isAdmin
                ? colors.accent + "26"
                : colors.primary + "26",
              borderColor: user?.isAdmin
                ? colors.accent + "70"
                : colors.primary + "60",
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Feather
            name={user?.isAdmin ? "shield" : "headphones"}
            size={18}
            color={user?.isAdmin ? colors.accent : colors.primary}
          />
        </Pressable>
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
            <>
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

              <Pressable
                onPress={handleMicPress}
                style={({ pressed }) => [
                  styles.mediaBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="mic" size={18} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                onPress={showAttachMenu}
                style={({ pressed }) => [
                  styles.mediaBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
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
  headerBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "flex-end", gap: 2 },
  headerTitle: { fontSize: 16 },
  headerStatusRow: { flexDirection: "row-reverse", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerStatus: { fontSize: 11 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  kavWrap: { flex: 1 },
  listContent: { paddingTop: 16, paddingBottom: 8, flexGrow: 1 },
  inputBar: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
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
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  recordingRow: {
    flex: 1, flexDirection: "row-reverse",
    alignItems: "center", gap: 12, paddingVertical: 6,
  },
  recordStopBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  recordingIndicator: {
    flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 8,
  },
  recordDot: { width: 8, height: 8, borderRadius: 4, opacity: 0.9 },
  recordTime: { fontSize: 18, letterSpacing: 1 },
  recordLabel: { fontSize: 12 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  adminCodeSheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  adminCodeHeader: {
    flexDirection: "row-reverse", alignItems: "center", gap: 10,
  },
  adminCodeTitle: { fontSize: 18 },
  adminCodeInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  adminError: { fontSize: 13, textAlign: "right" },
  adminCodeBtns: {
    flexDirection: "row-reverse", gap: 10, marginTop: 4,
  },
  adminCancelBtn: {
    flex: 1, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  adminCancelText: { fontSize: 15 },
  adminConfirmBtn: {
    flex: 1, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  adminConfirmText: { fontSize: 15 },
});
