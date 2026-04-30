import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const CHAT_KEY = "@alwaleed/chat/v1";

export type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
};

type ChatContextValue = {
  messages: ChatMessage[];
  loaded: boolean;
  isAgentTyping: boolean;
  send: (text: string) => Promise<void>;
  clear: () => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "agent",
  text:
    "السلام عليكم ورحمة الله. أهلاً بك في الدعم الفني لمؤسسة الوليد للإنسانية. كيف يمكنني مساعدتك اليوم؟",
  timestamp: Date.now(),
};

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getAgentReply(userText: string): string {
  const t = userText.toLowerCase();
  if (
    t.includes("تبرع") ||
    t.includes("donate") ||
    t.includes("مساعدة") ||
    t.includes("ادفع")
  ) {
    return "يمكنك التبرع مباشرة من تبويب الحملات. اختر الحملة التي تريد دعمها وسنرشدك خلال خطوات بسيطة. شكراً لكرمك.";
  }
  if (
    t.includes("تطوع") ||
    t.includes("volunteer") ||
    t.includes("انضم") ||
    t.includes("مشاركة")
  ) {
    return "نرحب بانضمامك إلى فريق المتطوعين. يرجى إرسال اسمك الكامل ومدينتك لنتواصل معك خلال 48 ساعة.";
  }
  if (
    t.includes("حملة") ||
    t.includes("campaign") ||
    t.includes("مشروع")
  ) {
    return "لدينا حالياً 48 حملة نشطة في 32 دولة. تفقد تبويب الحملات لمشاهدة التفاصيل وأين تذهب تبرعاتك بالضبط.";
  }
  if (t.includes("سلام") || t.includes("مرحبا") || t.includes("اهلا") || t.includes("hi") || t.includes("hello")) {
    return "وعليكم السلام ورحمة الله وبركاته. أنا هنا للإجابة على استفساراتك. هل تريد معرفة المزيد عن حملة معينة؟";
  }
  if (t.includes("شكر") || t.includes("thanks") || t.includes("thank")) {
    return "العفو، الشكر لله أولاً ولكم على كرمكم. نحن في خدمتكم دائماً.";
  }
  if (t.includes("اتصال") || t.includes("هاتف") || t.includes("contact") || t.includes("phone")) {
    return "يمكنك التواصل معنا على البريد contact@alwaleed-humanity.org أو زيارة قسم 'عن المؤسسة' لمزيد من قنوات التواصل.";
  }
  return "شكراً لتواصلك. تم استلام رسالتك وسيقوم أحد ممثلي الدعم بالرد عليك في أقرب وقت ممكن. إذا كان استفسارك عاجلاً، يرجى الاتصال بنا مباشرة.";
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isAgentTyping, setIsAgentTyping] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CHAT_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          setMessages(parsed.length > 0 ? parsed : [WELCOME_MESSAGE]);
        } else {
          setMessages([WELCOME_MESSAGE]);
          await AsyncStorage.setItem(
            CHAT_KEY,
            JSON.stringify([WELCOME_MESSAGE]),
          );
        }
        setLoaded(true);
      } catch {
        if (cancelled) return;
        setMessages([WELCOME_MESSAGE]);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(next));
    } catch {
      // ignore persistence errors
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, userMsg];
        persist(next);
        return next;
      });

      setIsAgentTyping(true);

      const replyText = getAgentReply(trimmed);
      const delay = 900 + Math.random() * 800;

      setTimeout(() => {
        const agentMsg: ChatMessage = {
          id: generateId(),
          role: "agent",
          text: replyText,
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          const next = [...prev, agentMsg];
          persist(next);
          return next;
        });
        setIsAgentTyping(false);
      }, delay);
    },
    [persist],
  );

  const clear = useCallback(async () => {
    setMessages([WELCOME_MESSAGE]);
    await persist([WELCOME_MESSAGE]);
  }, [persist]);

  return (
    <ChatContext.Provider
      value={{ messages, loaded, isAgentTyping, send, clear }}
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
