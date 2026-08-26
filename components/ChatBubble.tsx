import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ChatMessage } from "@/hooks/useChat";

type Props = { message: ChatMessage };

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDuration(ms?: number) {
  if (!ms) return "0:00";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function VoiceBubble({
  message,
  isUser,
}: {
  message: ChatMessage;
  isUser: boolean;
}) {
  const colors = useColors();
  const [playing, setPlaying] = useState(false);

  const handlePlay = async () => {
    if (Platform.OS === "web" || !message.mediaUrl) return;
    try {
      const { Audio } = await import("expo-av");
      setPlaying(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: true },
      );
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch {
      setPlaying(false);
    }
  };

  return (
    <View style={styles.voiceRow}>
      <Pressable
        onPress={handlePlay}
        style={[
          styles.voicePlayBtn,
          {
            backgroundColor: isUser
              ? "rgba(255,255,255,0.25)"
              : colors.accent + "25",
          },
        ]}
      >
        {playing ? (
          <ActivityIndicator
            size="small"
            color={isUser ? "#fff" : colors.accent}
          />
        ) : (
          <Feather
            name="play"
            size={14}
            color={isUser ? "#fff" : colors.accent}
          />
        )}
      </Pressable>
      <View style={styles.voiceWaveRow}>
        {Array.from({ length: 16 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.voiceBar,
              {
                height: 4 + Math.sin(i * 1.2) * 8 + 8,
                backgroundColor: isUser
                  ? "rgba(255,255,255,0.6)"
                  : colors.accent + "80",
              },
            ]}
          />
        ))}
      </View>
      <Text
        style={[
          styles.voiceDuration,
          {
            color: isUser ? "rgba(255,255,255,0.7)" : colors.mutedForeground,
            fontFamily: "Inter_400Regular",
          },
        ]}
      >
        {formatDuration(message.durationMs)}
      </Text>
    </View>
  );
}

function ImageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  return (
    <Image
      source={{ uri: message.mediaUrl }}
      style={styles.imageContent}
      contentFit="cover"
      accessibilityLabel="صورة مرسلة"
    />
  );
}

function FileBubble({
  message,
  isUser,
}: {
  message: ChatMessage;
  isUser: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.fileRow}>
      <View
        style={[
          styles.fileIconWrap,
          {
            backgroundColor: isUser
              ? "rgba(255,255,255,0.2)"
              : colors.primary + "20",
          },
        ]}
      >
        <MaterialCommunityIcons
          name="file-document-outline"
          size={22}
          color={isUser ? "#fff" : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.fileName,
            {
              color: isUser ? "#fff" : colors.foreground,
              fontFamily: "Inter_600SemiBold",
            },
          ]}
          numberOfLines={1}
        >
          {message.fileName ?? "ملف مرفق"}
        </Text>
        <Text
          style={[
            styles.fileType,
            {
              color: isUser ? "rgba(255,255,255,0.65)" : colors.mutedForeground,
              fontFamily: "Inter_400Regular",
            },
          ]}
        >
          مرفق
        </Text>
      </View>
    </View>
  );
}

export function ChatBubble({ message }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const hasMedia = !!message.mediaType;
  const isImageOrVideo =
    message.mediaType === "image" || message.mediaType === "video";

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
            padding: isImageOrVideo ? 4 : undefined,
            overflow: "hidden",
          },
        ]}
      >
        {/* Media content */}
        {message.mediaType === "image" || message.mediaType === "video" ? (
          <>
            <ImageBubble message={message} />
            {!!message.text && (
              <Text
                style={[
                  styles.text,
                  {
                    color: isUser ? colors.primaryForeground : colors.foreground,
                    fontFamily: "Inter_500Medium",
                    writingDirection: "rtl",
                    textAlign: "right",
                    paddingHorizontal: 10,
                    paddingBottom: 4,
                    paddingTop: 6,
                  },
                ]}
              >
                {message.text}
              </Text>
            )}
          </>
        ) : message.mediaType === "voice" ? (
          <VoiceBubble message={message} isUser={isUser} />
        ) : message.mediaType === "file" ? (
          <FileBubble message={message} isUser={isUser} />
        ) : (
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
        )}

        {/* Timestamp */}
        {!isImageOrVideo && (
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
        )}

        {/* Timestamp below image */}
        {isImageOrVideo && (
          <Text
            style={[
              styles.imageTime,
              { color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" },
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
        )}
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
  // Image / video
  imageContent: {
    width: 220,
    height: 165,
    borderRadius: 14,
  },
  imageTime: {
    fontSize: 10,
    position: "absolute",
    bottom: 8,
    right: 10,
  },
  // Voice
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 180,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceWaveRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 28,
  },
  voiceBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  voiceDuration: {
    fontSize: 11,
    minWidth: 32,
  },
  // File
  fileRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    minWidth: 160,
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    fontSize: 13,
    textAlign: "right",
  },
  fileType: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 2,
  },
});
