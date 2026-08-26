import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthModal } from "@/components/AuthModal";
import { Card } from "@/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

function AvatarCircle({
  name,
  avatarUrl,
  size = 92,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
}) {
  const colors = useColors();
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatarRing,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          borderColor: colors.primary,
        },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.avatarInitials,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary + "22",
              borderColor: colors.primary + "55",
            },
          ]}
        >
          <Text
            style={[
              styles.avatarInitialsText,
              {
                color: colors.primary,
                fontFamily: "Inter_700Bold",
                fontSize: size * 0.36,
              },
            ]}
          >
            {initials || "م"}
          </Text>
        </View>
      )}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + "18" }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {label}
        </Text>
        <Text
          style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
          numberOfLines={1}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, sessionId, loading, authDecided, signInWithGoogle, skipAuth, signOut, updateProfile } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAnon = !user;

  const enterEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(user?.phone ?? "");
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("خطأ", "يرجى إدخال الاسم.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(editName.trim(), editPhone.trim());
      setEditMode(false);
    } catch {
      Alert.alert("خطأ", "تعذّر حفظ البيانات. يرجى المحاولة مجدداً.");
    }
    setSaving(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      "تسجيل الخروج",
      "هل تريد تسجيل الخروج من حسابك؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "خروج",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.back();
          },
        },
      ],
    );
  };

  const handleGoogleSignIn = async () => {
    setShowAuthModal(false);
    await signInWithGoogle();
  };

  const displayName = user?.name || "مستخدم مجهول";
  const displayEmail = user?.email || "غير مسجّل";
  const displayPhone = user?.phone || "";
  const shortSession = sessionId.replace("anon_", "").slice(0, 12).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthModal
        visible={showAuthModal}
        onGoogleSignIn={handleGoogleSignIn}
        onSkip={() => { setShowAuthModal(false); skipAuth(); }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar hero block */}
        <View style={styles.heroBlock}>
          <AvatarCircle
            name={displayName}
            avatarUrl={user?.avatar}
            size={92}
          />

          {!editMode ? (
            <>
              <Text
                style={[
                  styles.heroName,
                  { color: colors.foreground, fontFamily: "Inter_700Bold" },
                ]}
              >
                {displayName}
              </Text>
              <Text
                style={[
                  styles.heroEmail,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                {displayEmail}
              </Text>

              <View style={styles.heroBadgeRow}>
                <View
                  style={[
                    styles.heroBadge,
                    {
                      backgroundColor: isAnon
                        ? colors.secondary
                        : colors.accent + "22",
                      borderColor: isAnon ? colors.border : colors.accent + "55",
                    },
                  ]}
                >
                  <Feather
                    name={isAnon ? "user" : "check-circle"}
                    size={12}
                    color={isAnon ? colors.mutedForeground : colors.accent}
                  />
                  <Text
                    style={[
                      styles.heroBadgeText,
                      {
                        color: isAnon ? colors.mutedForeground : colors.accent,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    {isAnon ? "مستخدم مجهول" : "حساب Google"}
                  </Text>
                </View>

                {!isAnon && !editMode && (
                  <Pressable
                    onPress={enterEdit}
                    style={({ pressed }) => [
                      styles.editBtn,
                      {
                        backgroundColor: colors.primary + "18",
                        borderColor: colors.primary + "44",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Feather name="edit-2" size={13} color={colors.primary} />
                    <Text
                      style={[
                        styles.editBtnText,
                        { color: colors.primary, fontFamily: "Inter_500Medium" },
                      ]}
                    >
                      تعديل
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          ) : null}
        </View>

        {/* Edit form */}
        {editMode && !isAnon && (
          <Card style={{ gap: 14 }}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              تعديل البيانات
            </Text>

            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                الاسم الكامل
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="أدخل اسمك..."
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.fieldInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    fontFamily: "Inter_400Regular",
                    textAlign: "right",
                    writingDirection: "rtl",
                  },
                ]}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                رقم الهاتف
              </Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+966 5X XXX XXXX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                style={[
                  styles.fieldInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    fontFamily: "Inter_400Regular",
                    textAlign: "right",
                    writingDirection: "rtl",
                  },
                ]}
                returnKeyType="done"
                onSubmitEditing={saveEdit}
              />
            </View>

            <View style={styles.editActions}>
              <Pressable
                onPress={cancelEdit}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
                  ]}
                >
                  إلغاء
                </Text>
              </Pressable>

              <Pressable
                onPress={saveEdit}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: pressed || saving ? 0.8 : 1 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.saveBtnText,
                      { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    حفظ التغييرات
                  </Text>
                )}
              </Pressable>
            </View>
          </Card>
        )}

        {/* Profile info (view mode) */}
        {!editMode && (
          <Card padded={false} style={{ overflow: "hidden" }}>
            <InfoRow icon="user" label="الاسم" value={displayName} />
            <InfoRow icon="mail" label="البريد الإلكتروني" value={displayEmail} />
            <InfoRow icon="phone" label="رقم الهاتف" value={displayPhone || "لم يُضف بعد"} />
          </Card>
        )}

        {/* Account details */}
        <Card padded={false} style={{ overflow: "hidden" }}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.accent + "18" }]}>
              <Feather name="key" size={16} color={colors.accent} />
            </View>
            <View style={styles.infoText}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                معرّف الجلسة
              </Text>
              <Text
                style={[
                  styles.infoValueMono,
                  { color: colors.foreground, fontFamily: "Inter_400Regular" },
                ]}
                numberOfLines={1}
              >
                {shortSession}...
              </Text>
            </View>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.accent + "18" }]}>
              <Feather name="shield" size={16} color={colors.accent} />
            </View>
            <View style={styles.infoText}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                نوع الحساب
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.foreground, fontFamily: "Inter_500Medium" },
                ]}
              >
                {isAnon ? "مجهول (بدون تسجيل)" : "حساب Google مُفعَّل"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Anonymous CTA — sign in with Google */}
        {isAnon && (
          <Card style={{ gap: 12, alignItems: "center" }}>
            <View style={[styles.anonIconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="user-plus" size={28} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.anonTitle,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              سجّل دخولك لتجربة أفضل
            </Text>
            <Text
              style={[
                styles.anonDesc,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              احتفظ بسجل محادثاتك، أضف اسمك ورقم هاتفك، وتابع تبرعاتك عبر أجهزتك.
            </Text>
            <Pressable
              onPress={() => setShowAuthModal(true)}
              style={({ pressed }) => [
                styles.googleSignInBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="log-in" size={16} color={colors.primaryForeground} />
              <Text
                style={[
                  styles.googleSignInText,
                  { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                تسجيل الدخول بـ Google
              </Text>
            </Pressable>
          </Card>
        )}

        {/* Sign out — only for authenticated users */}
        {!isAnon && (
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutBtn,
              {
                backgroundColor: colors.destructive + "18",
                borderColor: colors.destructive + "44",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text
              style={[
                styles.signOutText,
                { color: colors.destructive, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              تسجيل الخروج
            </Text>
          </Pressable>
        )}

        <Text
          style={[
            styles.versionNote,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          AlWaleed for Humanity — v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  heroBlock: {
    alignItems: "center",
    gap: 10,
    paddingBottom: 8,
  },
  avatarRing: {
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarImg: {},
  avatarInitials: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarInitialsText: {},
  heroName: {
    fontSize: 22,
    textAlign: "center",
  },
  heroEmail: {
    fontSize: 13,
    textAlign: "center",
  },
  heroBadgeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  heroBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroBadgeText: { fontSize: 12 },
  editBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13 },
  sectionTitle: {
    fontSize: 16,
    textAlign: "right",
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    textAlign: "right",
  },
  fieldInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  editActions: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15 },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 15 },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 11, textAlign: "right" },
  infoValue: { fontSize: 14, textAlign: "right" },
  infoValueMono: { fontSize: 13, textAlign: "right", letterSpacing: 0.5 },
  anonIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  anonTitle: { fontSize: 17, textAlign: "center" },
  anonDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  googleSignInBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  googleSignInText: { fontSize: 15 },
  signOutBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  signOutText: { fontSize: 16 },
  versionNote: {
    fontSize: 11,
    textAlign: "center",
    opacity: 0.6,
    marginTop: 4,
  },
});
