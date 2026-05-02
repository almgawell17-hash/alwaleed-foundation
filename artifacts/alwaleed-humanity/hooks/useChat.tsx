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

import { CHAT_TABLE, supabase } from "@/lib/supabase";

const CHAT_KEY = "@alwaleed/chat/v1";
const SESSION_KEY = "@alwaleed/session/v1";

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

function getAgentReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("تبرع") || t.includes("donate") || t.includes("ادفع"))
    return "يمكنك التبرع مباشرة من تبويب الحملات. اختر الحملة التي تريد دعمها وسنرشدك خلال خطوات بسيطة. شكراً لكرمك.";
  if (t.includes("تطوع") || t.includes("volunteer") || t.includes("انضم"))
    return "نرحب بانضمامك إلى فريق المتطوعين. يرجى إرسال اسمك الكامل ومدينتك لنتواصل معك خلال 48 ساعة.";
  if (t.includes("حملة") || t.includes("campaign") || t.includes("مشروع"))
    return "لدينا حالياً 48 حملة نشطة في 32 دولة. تفقد تبويب الحملات لمشاهدة التفاصيل وأين تذهب تبرعاتك بالضبط.";
  if (
    t.includes("سلام") ||
    t.includes("مرحبا") ||
    t.includes("اهلا") ||
    t.includes("hi") ||
    t.includes("hello")
  )
    return "وعليكم السلام ورحمة الله وبركاته. أنا هنا للإجابة على استفساراتك. هل تريد معرفة المزيد عن حملة معينة؟";
  if (t.includes("شكر") || t.includes("thanks"))
    return "العفو، الشكر لله أولاً ولكم على كرمكم. نحن في خدمتكم دائماً.";
  if (t.includes("مساعدة") || t.includes("help"))
    return "يسعدنا مساعدتك. يمكنك تقديم طلب مساعدة عبر زر 'اطلب مساعدة الآن' في الصفحة الرئيسية أو شرح حالتك هنا.";
  return "شكراً لتواصلك. تم استلام رسالتك وسيقوم أحد ممثلي الدعم بالرد عليك في أقرب وقت ممكن.";
}

async function scheduleNotification(body: string) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "مؤسسة الوليد للإنسانية",
        body,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    // Notifications not available
  }
}

async function requestNotificationPermission() {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // ignore
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const sessionRef = useRef<string>("");
  const localIds = useRef(new Set<string>());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const persist = useCallback(async (msgs: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Request notification permissions
      await requestNotificationPermission();

      // 2. Load or generate session ID
      let sid = await AsyncStorage.getItem(SESSION_KEY).catch(() => null);
      if (!sid) {
        sid = generateId();
        await AsyncStorage.setItem(SESSION_KEY, sid).catch(() => {});
      }
      sessionRef.current = sid;

      // 3. Load messages from local cache
      try {
        const raw = await AsyncStorage.getItem(CHAT_KEY);
        if (cancelled) return;
        if (raw) {
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

      // 4. Subscribe to Supabase Realtime
      if (Platform.OS === "web") return; // realtime works on native only reliably
      try {
        const channel = supabase
          .channel(`chat_session_${sid}`)
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

              // Skip messages we inserted ourselves
              if (localIds.current.has(row.id)) return;

              const msg: ChatMessage = {
                id: row.id,
                role: row.role as "user" | "agent",
                text: row.content ?? "",
                timestamp: new Date(row.created_at).getTime(),
                mediaType: row.media_type as MediaType | undefined,
                fileName: row.file_name,
              };

              if (cancelled) return;
              setMessages((prev) => {
                const next = [...prev, msg];
                persist(next);
                return next;
              });

              // Fire notification + sound for real agent replies
              if (row.role === "agent") {
                scheduleNotification(row.content ?? "رسالة جديدة");
              }
            },
          )
          .subscribe();

        channelRef.current = channel;
      } catch {
        // Supabase not reachable — local mode
      }
    })();

    return () => {
      cancelled = true;
      channelRef.current?.unsubscribe().catch(() => {});
      channelRef.current = null;
    };
  }, [persist]);

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

      // Save text message to Supabase (media URIs are local, skip uploading)
      if (trimmed && !media) {
        supabase
          .from(CHAT_TABLE)
          .insert({
            id: msgId,
            session_id: sessionRef.current,
            role: "user",
            content: trimmed,
          })
          .then(({ error }) => {
            if (error) console.warn("[Chat] Supabase insert:", error.message);
          });
      }

      // Auto-reply only for text messages
      if (trimmed) {
        setIsAgentTyping(true);
        const replyText = getAgentReply(trimmed);
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

          // Persist agent reply to Supabase so admins can see conversation
          supabase
            .from(CHAT_TABLE)
            .insert({
              id: replyId,
              session_id: sessionRef.current,
              role: "agent",
              content: replyText,
            })
            .catch(() => {});
        }, delay);
      }
    },
    [persist],
  );

  const clear = useCallback(async () => {
    setMessages([WELCOME]);
    await persist([WELCOME]);
  }, [persist]);

  return (
    <ChatContext.Provider value={{ messages, loaded, isAgentTyping, send, clear }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
