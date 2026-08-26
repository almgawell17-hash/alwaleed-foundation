import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { CHAT_TABLE, MEDIA_BUCKET, supabase } from "@/lib/supabase";

const CHAT_KEY = "@alwaleed/chat/v2";

export type MediaType = "image" | "video" | "voice" | "file";

export type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
  mediaUrl?: string;
  mediaType?: MediaType;
  fileName?: string;
  durationMs?: number;
};

export type SendMediaPayload = {
  uri: string;
  type: MediaType;
  name?: string;
  durationMs?: number;
};

type ChatContextValue = {
  messages: ChatMessage[];
  loaded: boolean;
  isAgentTyping: boolean;
  sessionId: string;
  send: (text: string, media?: SendMediaPayload) => Promise<void>;
  clear: () => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "agent",
  text: "السلام عليكم ورحمة الله. أهلاً بك في الدعم الفني لمؤسسة الوليد للإنسانية. كيف يمكنني مساعدتك اليوم؟",
  timestamp: Date.now(),
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getAutoReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("تبرع") || t.includes("donate"))
    return "يمكنك التبرع من تبويب الحملات. اختر الحملة وسنرشدك خلال خطوات بسيطة. شكراً لكرمك.";
  if (t.includes("تطوع") || t.includes("volunteer"))
    return "نرحب بانضمامك. يرجى إرسال اسمك الكامل ومدينتك لنتواصل معك خلال 48 ساعة.";
  if (t.includes("حملة") || t.includes("campaign"))
    return "لدينا حالياً 48 حملة نشطة في 32 دولة. تفقد تبويب الحملات لمشاهدة التفاصيل.";
  if (t.includes("سلام") || t.includes("مرحبا") || t.includes("hi") || t.includes("hello"))
    return "وعليكم السلام ورحمة الله وبركاته. أنا هنا للإجابة على استفساراتك. هل تريد معرفة المزيد عن حملة معينة؟";
  if (t.includes("شكر") || t.includes("thanks"))
    return "العفو، الشكر لله أولاً ولكم. نحن في خدمتكم دائماً.";
  if (t.includes("مساعدة") || t.includes("help"))
    return "يسعدنا مساعدتك. يمكنك تقديم طلب مساعدة عبر زر 'اطلب مساعدة الآن' في الصفحة الرئيسية.";
  return "شكراً لتواصلك. تم استلام رسالتك وسيقوم أحد ممثلي الدعم بالرد عليك في أقرب وقت ممكن.";
}

async function uploadMedia(media: SendMediaPayload, sessionId: string, messageId: string) {
  const response = await fetch(media.uri);
  const body = await response.arrayBuffer();
  const extension = media.name?.split(".").pop() ?? "bin";
  const path = `${sessionId}/${messageId}.${extension}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function scheduleNotification(body: string) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    await Notifications.scheduleNotificationAsync({
      content: { title: "مؤسسة الوليد للإنسانية", body, sound: true },
      trigger: null,
    });
  } catch {}
}

async function requestNotificationPermission() {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") await Notifications.requestPermissionsAsync();
  } catch {}
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { sessionId } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const localIds = useRef(new Set<string>());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const chatKey = CHAT_KEY + (sessionId ? `_${sessionId}` : "");

  const persist = useCallback(
    async (msgs: ChatMessage[]) => {
      if (!sessionId) return;
      try {
        await AsyncStorage.setItem(chatKey, JSON.stringify(msgs));
      } catch {}
    },
    [chatKey, sessionId],
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      await requestNotificationPermission();

      try {
        const raw = await AsyncStorage.getItem(chatKey);
        if (cancelled) return;
        const { data: remoteRows } = await supabase
          .from(CHAT_TABLE)
          .select("id, role, content, media_url, media_type, file_name, created_at")
          .eq("conversation_id", sessionId)
          .order("created_at", { ascending: true });
        if (remoteRows?.length) {
          const remoteMessages = remoteRows.map((row) => ({
            id: row.id,
            role: row.role as "user" | "agent",
            text: row.content ?? "",
            timestamp: new Date(row.created_at).getTime(),
            mediaUrl: row.media_url ?? undefined,
            mediaType: row.media_type as MediaType | undefined,
            fileName: row.file_name ?? undefined,
          }));
          setMessages(remoteMessages);
          await persist(remoteMessages);
          setLoaded(true);
        } else if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          setMessages(parsed.length > 0 ? parsed : [WELCOME]);
        } else {
          setMessages([WELCOME]);
          await persist([WELCOME]);
        }
      } catch {
        if (cancelled) return;
        setMessages([WELCOME]);
      }
      setLoaded(true);

      try {
        channelRef.current?.unsubscribe().catch(() => {});
        const channel = supabase
          .channel(`chat_user_${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: CHAT_TABLE,
              filter: `conversation_id=eq.${sessionId}`,
            },
            (payload) => {
              const row = payload.new as {
                id: string;
                role: string;
                content: string;
                created_at: string;
                media_type?: string;
                file_name?: string;
                media_url?: string;
              };
              if (localIds.current.has(row.id)) return;
              const msg: ChatMessage = {
                id: row.id,
                role: row.role as "user" | "agent",
                text: row.content ?? "",
                timestamp: new Date(row.created_at).getTime(),
                mediaUrl: row.media_url,
                mediaType: row.media_type as MediaType | undefined,
                fileName: row.file_name,
              };
              if (cancelled) return;
              setMessages((prev) => {
                const next = [...prev, msg];
                persist(next);
                return next;
              });
              if (row.role === "agent") {
                scheduleNotification(row.content ?? "رسالة جديدة من الدعم الفني");
              }
            },
          )
          .subscribe();
        channelRef.current = channel;
      } catch {}
    })();

    return () => {
      cancelled = true;
      channelRef.current?.unsubscribe().catch(() => {});
      channelRef.current = null;
    };
  }, [sessionId, chatKey, persist]);

  const send = useCallback(
    async (text: string, media?: SendMediaPayload) => {
      const trimmed = text.trim();
      if (!trimmed && !media) return;

      const msgId = generateId();
      const userMsg: ChatMessage = {
        id: msgId,
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
        ...(media
          ? {
              mediaUrl: media.uri,
              mediaType: media.type,
              fileName: media.name,
              durationMs: media.durationMs,
            }
          : {}),
      };

      localIds.current.add(msgId);
      setMessages((prev) => {
        const next = [...prev, userMsg];
        persist(next);
        return next;
      });

      try {
        const mediaUrl = media
          ? await uploadMedia(media, sessionId, msgId)
          : undefined;
        const { error } = await supabase.from(CHAT_TABLE).insert({
          id: msgId,
          conversation_id: sessionId,
          role: "user",
          content: trimmed || null,
          media_url: mediaUrl,
          media_type: media?.type,
          file_name: media?.name,
        });
        if (error) throw error;
      } catch (error) {
        console.warn("[Chat] message insert:", error instanceof Error ? error.message : error);
      }

      if (trimmed) {
        setIsAgentTyping(true);
        const replyText = getAutoReply(trimmed);
        const delay = 900 + Math.random() * 700;
        setTimeout(() => {
          const replyId = generateId();
          const agentMsg: ChatMessage = {
            id: replyId,
            role: "agent",
            text: replyText,
            timestamp: Date.now(),
          };
          localIds.current.add(replyId);
          setMessages((prev) => {
            const next = [...prev, agentMsg];
            persist(next);
            return next;
          });
          setIsAgentTyping(false);
          supabase
            .from(CHAT_TABLE)
            .insert({
              id: replyId,
              conversation_id: sessionId,
              role: "agent",
              content: replyText,
            })
            .then(() => {}, () => {});
        }, delay);
      }
    },
    [persist, sessionId],
  );

  const clear = useCallback(async () => {
    setMessages([WELCOME]);
    await persist([WELCOME]);
  }, [persist]);

  return (
    <ChatContext.Provider
      value={{ messages, loaded, isAgentTyping, sessionId, send, clear }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
