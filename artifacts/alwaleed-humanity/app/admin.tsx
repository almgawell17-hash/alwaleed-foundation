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
  Platform,
  Keyboard,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/hooks/useChat";
import { useColors } from "@/hooks/useColors";
import { CHAT_TABLE, supabase } from "@/lib/supabase";

// --- دالة المساعدة للوقت والمعرفات ---
function generateId() {
  return "adm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  return `منذ ${Math.floor(mins / 60)} س`;
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const channelRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);

  const isAdmin = user?.isAdmin ?? false;

  // 1. جلب المحادثات وترتيبها (الأحدث أولاً)
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from(CHAT_TABLE)
        .select("session_id, content, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const map = new Map();
      data?.forEach((row) => {
        if (!map.has(row.session_id)) {
          map.set(row.session_id, {
            sessionId: row.session_id,
            lastMessage: row.content,
            lastRole: row.role,
            lastTime: new Date(row.created_at).getTime(),
            unread: row.role === "user", 
          });
        }
      });
      setSessions(Array.from(map.values()));
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadSessions();
  }, [isAdmin, loadSessions]);

  // 2. نظام الـ Presence (لمعرفة حالة الكتابة)
  useEffect(() => {
    if (!selectedSession) return;

    const pChannel = supabase.channel(`presence:${selectedSession}`);

    pChannel
      .on("presence", { event: "sync" }, () => {
        const state = pChannel.presenceState();
        // التحقق مما إذا كان أي مستخدم (غير الأدمن) يكتب
        const typing = Object.values(state).some((p: any) => p[0]?.isTyping && p[0]?.role === "user");
        setIsUserTyping(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await pChannel.track({ role: "agent", isTyping: reply.length > 0 });
        }
      });

    presenceChannelRef.current = pChannel;
    return () => { pChannel.unsubscribe(); };
  }, [selectedSession, reply.length]);

  // 3. فتح محادثة وجلب رسائلها
  const openSession = async (sid: string) => {
    setSelectedSession(sid);
    setLoadingMessages(true);
    try {
      const { data } = await supabase
        .from(CHAT_TABLE)
        .select("*")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });

      setMessages(data?.map(row => ({
        id: row.id,
        role: row.role,
        text: row.content,
        timestamp: new Date(row.created_at).getTime(),
      })) || []);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 4. إرسال الرد
  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const textToSend = reply;

    try {
      const { error } = await supabase.from(CHAT_TABLE).insert({
        session_id: selectedSession,
        role: "agent",
        content: textToSend,
      });
      if (!error) {
          setReply("");
          Keyboard.dismiss();
      }
    } catch (err) {
      alert("فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) return <View style={styles.center}><Text>غير مصرح بالدخول</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {selectedSession ? `مستخدم #${selectedSession.slice(0,5)}` : "لوحة الإدارة"}
        </Text>
        {selectedSession && (
          <Pressable onPress={() => setSelectedSession(null)}><Feather name="arrow-right" size={24} color={colors.primary} /></Pressable>
        )}
      </View>

      {selectedSession ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20} // دفع المربع للأعلى
        >
          <FlatList
            data={[...messages].reverse()}
            inverted
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={{ padding: 16 }}
            ListFooterComponent={isUserTyping ? <TypingIndicator /> : null}
          />

          {/* Input Bar */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.foreground }]}
              value={reply}
              onChangeText={setReply}
              placeholder="اكتب ردك هنا..."
              multiline
            />
            <Pressable onPress={sendReply} style={[styles.sendBtn, { backgroundColor: colors.accent }]}>
              {sending ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={20} color="#fff" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={sessions}
          renderItem={({ item }) => (
            <Pressable onPress={() => openSession(item.sessionId)} style={styles.sessionCard}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>مستخدم #{item.sessionId.slice(0,8)}</Text>
                <Text style={styles.sessionPreview} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
              {item.unread && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
              <Text style={styles.sessionTime}>{timeAgo(item.lastTime)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  sessionCard: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#ccc', alignItems: 'center' },
  sessionInfo: { flex: 1, marginRight: 10, alignItems: 'flex-end' },
  sessionTitle: { fontWeight: '600', fontSize: 15 },
  sessionPreview: { color: '#666', fontSize: 13 },
  sessionTime: { fontSize: 11, color: '#999' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
  inputBar: { flexDirection: 'row-reverse', padding: 10, alignItems: 'center', borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, textAlign: 'right', minHeight: 40 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
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
  Platform,
  Keyboard,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/hooks/useChat";
import { useColors } from "@/hooks/useColors";
import { CHAT_TABLE, supabase } from "@/lib/supabase";

// --- دالة المساعدة للوقت والمعرفات ---
function generateId() {
  return "adm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  return `منذ ${Math.floor(mins / 60)} س`;
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const channelRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);

  const isAdmin = user?.isAdmin ?? false;

  // 1. جلب المحادثات وترتيبها (الأحدث أولاً)
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from(CHAT_TABLE)
        .select("session_id, content, role, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const map = new Map();
      data?.forEach((row) => {
        if (!map.has(row.session_id)) {
          map.set(row.session_id, {
            sessionId: row.session_id,
            lastMessage: row.content,
            lastRole: row.role,
            lastTime: new Date(row.created_at).getTime(),
            unread: row.role === "user", 
          });
        }
      });
      setSessions(Array.from(map.values()));
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadSessions();
  }, [isAdmin, loadSessions]);

  // 2. نظام الـ Presence (لمعرفة حالة الكتابة)
  useEffect(() => {
    if (!selectedSession) return;

    const pChannel = supabase.channel(`presence:${selectedSession}`);

    pChannel
      .on("presence", { event: "sync" }, () => {
        const state = pChannel.presenceState();
        // التحقق مما إذا كان أي مستخدم (غير الأدمن) يكتب
        const typing = Object.values(state).some((p: any) => p[0]?.isTyping && p[0]?.role === "user");
        setIsUserTyping(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await pChannel.track({ role: "agent", isTyping: reply.length > 0 });
        }
      });

    presenceChannelRef.current = pChannel;
    return () => { pChannel.unsubscribe(); };
  }, [selectedSession, reply.length]);

  // 3. فتح محادثة وجلب رسائلها
  const openSession = async (sid: string) => {
    setSelectedSession(sid);
    setLoadingMessages(true);
    try {
      const { data } = await supabase
        .from(CHAT_TABLE)
        .select("*")
        .eq("session_id", sid)
        .order("created_at", { ascending: true });

      setMessages(data?.map(row => ({
        id: row.id,
        role: row.role,
        text: row.content,
        timestamp: new Date(row.created_at).getTime(),
      })) || []);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 4. إرسال الرد
  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const textToSend = reply;

    try {
      const { error } = await supabase.from(CHAT_TABLE).insert({
        session_id: selectedSession,
        role: "agent",
        content: textToSend,
      });
      if (!error) {
          setReply("");
          Keyboard.dismiss();
      }
    } catch (err) {
      alert("فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) return <View style={styles.center}><Text>غير مصرح بالدخول</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {selectedSession ? `مستخدم #${selectedSession.slice(0,5)}` : "لوحة الإدارة"}
        </Text>
        {selectedSession && (
          <Pressable onPress={() => setSelectedSession(null)}><Feather name="arrow-right" size={24} color={colors.primary} /></Pressable>
        )}
      </View>

      {selectedSession ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20} // دفع المربع للأعلى
        >
          <FlatList
            data={[...messages].reverse()}
            inverted
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={{ padding: 16 }}
            ListFooterComponent={isUserTyping ? <TypingIndicator /> : null}
          />

          {/* Input Bar */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.foreground }]}
              value={reply}
              onChangeText={setReply}
              placeholder="اكتب ردك هنا..."
              multiline
            />
            <Pressable onPress={sendReply} style={[styles.sendBtn, { backgroundColor: colors.accent }]}>
              {sending ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={20} color="#fff" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={sessions}
          renderItem={({ item }) => (
            <Pressable onPress={() => openSession(item.sessionId)} style={styles.sessionCard}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>مستخدم #{item.sessionId.slice(0,8)}</Text>
                <Text style={styles.sessionPreview} numberOfLines={1}>{item.lastMessage}</Text>
              </View>
              {item.unread && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
              <Text style={styles.sessionTime}>{timeAgo(item.lastTime)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  sessionCard: { flexDirection: 'row-reverse', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#ccc', alignItems: 'center' },
  sessionInfo: { flex: 1, marginRight: 10, alignItems: 'flex-end' },
  sessionTitle: { fontWeight: '600', fontSize: 15 },
  sessionPreview: { color: '#666', fontSize: 13 },
  sessionTime: { fontSize: 11, color: '#999' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 10 },
  inputBar: { flexDirection: 'row-reverse', padding: 10, alignItems: 'center', borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, textAlign: 'right', minHeight: 40 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
