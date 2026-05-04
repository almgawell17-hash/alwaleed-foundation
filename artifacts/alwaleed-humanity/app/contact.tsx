import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller"; // يفضل استخدامها مع التابلت
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/hooks/useChat";
import { useColors } from "@/hooks/useColors";
import { CHAT_TABLE, supabase } from "@/lib/supabase";

// معرف فريد للمتصفح أو الجلسة (لأن الزائر قد لا يملك حساباً)
const SESSION_ID = "anon_user_123";

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isAgentOnline, setIsAgentOnline] = useState(false);

  const presenceChannelRef = useRef<any>(null);

  // 1. جلب الرسائل السابقة
  const loadMessages = useCallback(async () => {
    try {
      const { data } = await supabase
        .from(CHAT_TABLE)
        .select("*")
        .eq("session_id", SESSION_ID)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(
          data.map((row) => ({
            id: row.id,
            role: row.role,
            text: row.content,
            timestamp: new Date(row.created_at).getTime(),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. تفعيل نظام التواجد (Presence) لمعرفة حالة الأدمن
  useEffect(() => {
    loadMessages();

    const channel = supabase.channel(`presence:${SESSION_ID}`);
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const agentStatus: any = Object.values(state).find(
          (p: any) => p[0]?.role === "agent",
        );
        setIsAgentOnline(!!agentStatus);
        setIsAgentTyping(agentStatus?.[0]?.isTyping || false);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ role: "user", isTyping: input.length > 0 });
        }
      });

    presenceChannelRef.current = channel;

    // استماع للرسائل الجديدة
    const msgSub = supabase
      .channel("new_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: CHAT_TABLE,
          filter: `session_id=eq.${SESSION_ID}`,
        },
        (payload) => {
          const row = payload.new as any;
          setMessages((prev) => [
            ...prev,
            {
              id: row.id,
              role: row.role,
              text: row.content,
              timestamp: new Date(row.created_at).getTime(),
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      msgSub.unsubscribe();
    };
  }, [input.length]);

  // 3. إرسال الرسالة
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input;
    setInput("");

    try {
      const { error } = await supabase.from(CHAT_TABLE).insert({
        session_id: SESSION_ID,
        role: "user",
        content: text,
      });
      if (error) throw error;
      if (Platform.OS !== "web") Haptics.selectionAsync();
    } catch {
      setInput(text);
      alert("فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header المصغر */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.statusInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            الدعم الفني
          </Text>
          <View style={styles.onlineRow}>
            <Text
              style={[styles.statusText, { color: colors.mutedForeground }]}
            >
              {isAgentTyping
                ? "جاري الكتابة..."
                : isAgentOnline
                  ? "متصل الآن"
                  : "غير متصل"}
            </Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isAgentOnline ? "#4ADE80" : "#94A3B8" },
              ]}
            />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        // offset 90 لدفع الصندوق فوق شريط الأزرار السفلي (الرئيسية، الدردشة، إلخ)
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 85}
      >
        <FlatList
          data={[...messages].reverse()}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={isAgentTyping ? <TypingIndicator /> : null}
        />

        {/* صندوق الكتابة المرفوع */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="كيف يمكننا مساعدتك؟"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable
            onPress={sendMessage}
            disabled={!input.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: input.trim()
                  ? colors.primary
                  : colors.secondary,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  statusInfo: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  onlineRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  statusText: { fontSize: 11 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  inputContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    textAlign: "right",
    borderWidth: 1,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});