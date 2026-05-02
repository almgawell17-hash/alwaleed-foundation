import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/hooks/useChat";
import { useColors } from "@/hooks/useColors";
import { CHAT_TABLE, supabase } from "@/lib/supabase";

type SessionSummary = {
  sessionId: string;
  lastMessage: string;
  lastRole: "user" | "agent";
  lastTime: number;
  unread: boolean;
};

function generateId() {
  return "adm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} س`;
  return `منذ ${Math.floor(hrs / 24)} ي`;
}

function shortId(id: string): string {
  const clean = id.replace("anon_", "");
  return clean.slice(0, 8).toUpperCase();
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isAdmin = user?.isAdmin ?? false;

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from(CHAT_TABLE)
        .select("session_id, content, role, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const map = new Map<string, SessionSummary>();
      for (const row of data ?? []) {
        const ts = new Date(row.created_at as string).getTime();
        const existing = map.get(row.session_id as string);
        if (!existing) {
          map.set(row.session_id as string, {
            sessionId: row.session_id as string,
            lastMessage: (row.content as string) ?? "",
            lastRole: (row.role as "user" | "agent") ?? "user",
            lastTime: ts,
            unread: (row.role as string) === "user",
          });
        } else if (ts > existing.lastTime) {
          map.set(row.session_id as string, {
            ...existing,
            lastMessage: (row.content as string) ?? "",
            lastRole: (row.role as "user" | "agent") ?? "user",
            lastTime: ts,
            unread: (row.role as string) === "user",
          });
        }
      }

      const sorted = Array.from(map.values()).sort(
        (a, b) => b.lastTime - a.lastTime,
      );
      setSessions(sorted);
    } catch {
      setSessions([]);
    }
    setLoadingSessions(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadSessions();

    const ch = supabase
      .channel("admin_all_sessions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: CHAT_TABLE },
        () => {
          loadSessions();
        },
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      ch.unsubscribe().catch(() => {});
    };
  }, [isAdmin, loadSessions]);

  const openSession = useCallback(async (sid: string) => {
    setSelectedSession(sid);
    setLoadingMessages(true);
    setMessages([]);

    try {
      const { data, error } = await supabase
        .from(CHAT_TABLE)
        .select("*")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const msgs: ChatMessage[] = (data ?? []).map((row) => ({
        id: row.id as string,
        role: (row.role as "user" | "agent") ?? "user",
        text: (row.content as string) ?? "",
        timestamp: new Date(row.created_at as string).getTime(),
        mediaType: row.media_type as ChatMessage["mediaType"],
        fileName: row.file_name as string | undefined,
      }));

      setMessages(msgs);
    } catch {
      setMessages([]);
    }
    setLoadingMessages(false);

    sessionChannelRef.current?.unsubscribe().catch(() => {});
    const sch = supabase
      .channel(`admin_session_${sid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: CHAT_TABLE,
          filter: `session_id=eq.${sid}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            role: string;
            content: string;
            created_at: string;
            media_type?: string;
            file_name?: string;
          };
          const msg: ChatMessage = {
            id: row.id,
            role: row.role as "user" | "agent",
            text: row.content ?? "",
            timestamp: new Date(row.created_at).getTime(),
            mediaType: row.media_type as ChatMessage["mediaType"],
            fileName: row.file_name,
          };
          setMessages((prev) => [...prev, msg]);
        },
      )
      .subscribe();
    sessionChannelRef.current = sch;
  }, []);

  const sendReply = useCallback(async () => {
    const text = reply.trim();
    if (!text || !selectedSession || sending) return;
    setSending(true);
    setReply("");
    const id = generateId();
    try {
      await supabase.from(CHAT_TABLE).insert({
        id,
        session_id: selectedSession,
        role: "agent",
        content: text,
      });
    } catch {
      setReply(text);
    }
    setSending(false);
  }, [reply, selectedSession, sending]);

  const goBack = useCallback(() => {
    sessionChannelRef.current?.unsubscribe().catch(() => {});
    setSelectedSession(null);
    setMessages([]);
  }, []);

  const headerPad = insets.top + 12;
  const bottomPad = insets.bottom + 8;

  if (!isAdmin) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: headerPad },
        ]}
      >
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text
          style={[
            styles.accessDenied,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          غير مصرح لك بالوصول لهذه الصفحة
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
        >
          <Text
            style={[
              styles.backBtnText,
              { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            رجوع
          </Text>
        </Pressable>
      </View>
    );
  }

  if (selectedSession) {
    const reversed = [...messages].reverse();
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: headerPad,
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-right" size={20} color={colors.primary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              مستخدم #{shortId(selectedSession)}
            </Text>
            <Text
              style={[
                styles.headerSub,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              {selectedSession}
            </Text>
          </View>

          <View
            style={[
              styles.agentBadge,
              { backgroundColor: colors.accent + "22", borderColor: colors.accent + "55" },
            ]}
          >
            <Feather name="shield" size={14} color={colors.accent} />
            <Text
              style={[
                styles.agentBadgeText,
                { color: colors.accent, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              أدمن
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView behavior="padding" style={styles.kavWrap} keyboardVerticalOffset={0}>
          {loadingMessages ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              data={reversed}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChatBubble message={item} />}
              inverted
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                messages.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                      ]}
                    >
                      لا توجد رسائل في هذه المحادثة
                    </Text>
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
            />
          )}

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
              onPress={sendReply}
              disabled={!reply.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor:
                    reply.trim() && !sending ? colors.accent : colors.secondary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather
                  name="send"
                  size={18}
                  color={reply.trim() ? "#fff" : colors.mutedForeground}
                />
              )}
            </Pressable>

            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="رد كـ وكيل الدعم..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.accent + "55",
                  borderRadius: colors.radius,
                  fontFamily: "Inter_400Regular",
                  writingDirection: "rtl",
                  textAlign: "right",
                },
              ]}
              returnKeyType="send"
              onSubmitEditing={sendReply}
              blurOnSubmit={false}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: headerPad,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
          >
            لوحة الإدارة
          </Text>
          <Text
            style={[
              styles.headerSub,
              { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
            ]}
          >
            {sessions.length} محادثة نشطة
          </Text>
        </View>

        <Pressable
          onPress={loadSessions}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="refresh-cw" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {loadingSessions ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Feather name="message-square" size={42} color={colors.mutedForeground} />
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                marginTop: 12,
              },
            ]}
          >
            لا توجد محادثات بعد
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.sessionId}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => openSession(item.sessionId)}
              style={({ pressed }) => [
                styles.sessionCard,
                {
                  backgroundColor: pressed ? colors.card : colors.background,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.sessionAvatar,
                  { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" },
                ]}
              >
                <Text
                  style={[
                    styles.sessionAvatarText,
                    { color: colors.primary, fontFamily: "Inter_700Bold" },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <View style={styles.sessionInfo}>
                <View style={styles.sessionTopRow}>
                  <Text
                    style={[
                      styles.sessionTime,
                      { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                    ]}
                  >
                    {timeAgo(item.lastTime)}
                  </Text>
                  {item.unread && (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: colors.accent },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.sessionTitle,
                      {
                        color: item.unread ? colors.foreground : colors.mutedForeground,
                        fontFamily: item.unread ? "Inter_600SemiBold" : "Inter_500Medium",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    مستخدم #{shortId(item.sessionId)}
                  </Text>
                </View>

                <View style={styles.sessionPreviewRow}>
                  <Text
                    style={[
                      styles.sessionRole,
                      {
                        color:
                          item.lastRole === "agent" ? colors.accent : colors.primary,
                        fontFamily: "Inter_400Regular",
                        backgroundColor:
                          item.lastRole === "agent"
                            ? colors.accent + "18"
                            : colors.primary + "18",
                      },
                    ]}
                  >
                    {item.lastRole === "agent" ? "وكيل" : "مستخدم"}
                  </Text>
                  <Text
                    style={[
                      styles.sessionPreview,
                      {
                        color: item.unread ? colors.foreground : colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage || "(وسائط)"}
                  </Text>
                </View>
              </View>

              <Feather
                name="chevron-left"
                size={16}
                color={colors.mutedForeground}
                style={styles.chevron}
              />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerCenter: { flex: 1, alignItems: "flex-end", gap: 2 },
  headerTitle: { fontSize: 17 },
  headerSub: { fontSize: 11 },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  agentBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  agentBadgeText: { fontSize: 12 },
  sessionCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  sessionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sessionAvatarText: { fontSize: 16 },
  sessionInfo: { flex: 1, gap: 4 },
  sessionTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  sessionTitle: { flex: 1, fontSize: 14 },
  sessionTime: { fontSize: 11 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionPreviewRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  sessionRole: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  sessionPreview: { flex: 1, fontSize: 12 },
  chevron: { marginLeft: 4 },
  kavWrap: { flex: 1 },
  listContent: {
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: { fontSize: 14, textAlign: "center" },
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
  accessDenied: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { fontSize: 15 },
});
