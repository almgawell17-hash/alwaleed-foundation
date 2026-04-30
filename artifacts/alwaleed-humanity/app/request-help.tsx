import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { useColors } from "@/hooks/useColors";

const WHATSAPP_NUMBER = "966567232680";

export default function RequestHelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [idImage, setIdImage] = useState<ImagePicker.ImagePickerAsset | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const haptic = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const pickIdImage = async () => {
    haptic();
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "إذن مطلوب",
            "يرجى السماح بالوصول إلى معرض الصور لإرفاق صورة الهوية.",
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIdImage(result.assets[0]);
      }
    } catch {
      Alert.alert("تعذر اختيار الصورة", "حدث خطأ أثناء اختيار الصورة.");
    }
  };

  const removeIdImage = () => {
    haptic();
    setIdImage(null);
  };

  const buildMessage = () => {
    const lines = [
      "*طلب مساعدة جديد - مؤسسة الوليد للإنسانية*",
      "",
      `الاسم: ${name.trim()}`,
      `الجنسية: ${nationality.trim()}`,
      `رقم الهاتف: ${phone.trim()}`,
      `المبلغ المطلوب: ${amount.trim()} ريال`,
      `صورة الهوية: ${idImage ? "مرفقة (سيتم إرسالها بعد الرسالة)" : "غير مرفقة"}`,
    ];
    if (notes.trim()) {
      lines.push("", "ملاحظات:", notes.trim());
    }
    return lines.join("\n");
  };

  const onSubmit = async () => {
    if (
      !name.trim() ||
      !nationality.trim() ||
      !phone.trim() ||
      !amount.trim()
    ) {
      Alert.alert(
        "حقول مطلوبة",
        "الرجاء تعبئة الاسم والجنسية ورقم الهاتف والمبلغ المطلوب.",
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }

    const message = buildMessage();
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    setSubmitting(true);
    try {
      const supported = await Linking.canOpenURL(waUrl);
      if (!supported) {
        Alert.alert(
          "واتساب غير متوفر",
          "يرجى تثبيت تطبيق واتساب لإرسال الطلب، أو تواصل معنا عبر الرقم +966 56 723 2680.",
        );
        return;
      }
      await Linking.openURL(waUrl);
      if (idImage) {
        setTimeout(() => {
          Alert.alert(
            "تذكير بإرسال صورة الهوية",
            "تم فتح واتساب مع تفاصيل طلبك. الرجاء إرفاق صورة الهوية يدوياً في المحادثة بعد إرسال الرسالة.",
          );
        }, 700);
      }
    } catch {
      Alert.alert(
        "تعذر فتح واتساب",
        "حدث خطأ أثناء محاولة فتح واتساب. يرجى المحاولة مرة أخرى.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header intro */}
        <View style={styles.intro}>
          <View
            style={[
              styles.introIcon,
              { backgroundColor: colors.accent + "1F" },
            ]}
          >
            <MaterialCommunityIcons
              name="hand-heart-outline"
              size={28}
              color={colors.accent}
            />
          </View>
          <Text
            style={[
              styles.introTitle,
              {
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                writingDirection: "rtl",
              },
            ]}
          >
            تقديم طلب مساعدة
          </Text>
          <Text
            style={[
              styles.introSub,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                writingDirection: "rtl",
              },
            ]}
          >
            يرجى تعبئة البيانات التالية بدقة. سيتم إرسال طلبك مباشرة إلى فريق
            المؤسسة عبر واتساب لمراجعته والرد عليك.
          </Text>
        </View>

        {/* Form card */}
        <Card>
          <Text
            style={[
              styles.formTitle,
              {
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                writingDirection: "rtl",
              },
            ]}
          >
            بيانات المستفيد
          </Text>

          <Field
            label="اسم المستفيد"
            value={name}
            onChange={setName}
            placeholder="الاسم الرباعي كاملاً"
            required
            icon="account-outline"
          />
          <Field
            label="الجنسية"
            value={nationality}
            onChange={setNationality}
            placeholder="مثال: سعودي / يمني / سوري"
            required
            icon="flag-outline"
          />
          <Field
            label="رقم الهاتف"
            value={phone}
            onChange={setPhone}
            placeholder="05XXXXXXXX"
            required
            icon="phone-outline"
            keyboardType="phone-pad"
          />
          <Field
            label="المبلغ المطلوب (ريال سعودي)"
            value={amount}
            onChange={setAmount}
            placeholder="مثال: 5000"
            required
            icon="cash-multiple"
            keyboardType="number-pad"
          />

          {/* Identity image */}
          <View style={styles.field}>
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  writingDirection: "rtl",
                },
              ]}
            >
              إرفاق صورة الهوية
            </Text>

            {idImage ? (
              <View
                style={[
                  styles.imagePreview,
                  {
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Image
                  source={{ uri: idImage.uri }}
                  style={styles.imagePreviewImg}
                  resizeMode="cover"
                />
                <View style={styles.imagePreviewActions}>
                  <Pressable
                    onPress={pickIdImage}
                    style={({ pressed }) => [
                      styles.imageActionBtn,
                      {
                        backgroundColor: colors.primary + "26",
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name="refresh-cw"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.imageActionText,
                        {
                          color: colors.primary,
                          fontFamily: "Inter_600SemiBold",
                        },
                      ]}
                    >
                      تغيير
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={removeIdImage}
                    style={({ pressed }) => [
                      styles.imageActionBtn,
                      {
                        backgroundColor: "#E5484D26",
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Feather name="trash-2" size={14} color="#E5484D" />
                    <Text
                      style={[
                        styles.imageActionText,
                        {
                          color: "#E5484D",
                          fontFamily: "Inter_600SemiBold",
                        },
                      ]}
                    >
                      حذف
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={pickIdImage}
                style={({ pressed }) => [
                  styles.imagePicker,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.imagePickerIcon,
                    { backgroundColor: colors.primary + "1F" },
                  ]}
                >
                  <Feather
                    name="upload"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.imagePickerTitle,
                      {
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        writingDirection: "rtl",
                      },
                    ]}
                  >
                    اختر صورة الهوية
                  </Text>
                  <Text
                    style={[
                      styles.imagePickerSub,
                      {
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                        writingDirection: "rtl",
                      },
                    ]}
                  >
                    JPG أو PNG - أقل من 5 ميجا
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Notes */}
          <Field
            label="صندوق الملاحظات"
            value={notes}
            onChange={setNotes}
            placeholder="اشرح حالتك أو أضف أي تفاصيل إضافية..."
            icon="note-edit-outline"
            multiline
          />
        </Card>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Feather name="shield" size={14} color={colors.mutedForeground} />
          <Text
            style={[
              styles.privacyText,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                writingDirection: "rtl",
              },
            ]}
          >
            بياناتك سرية وتُستخدم فقط لمعالجة طلب المساعدة.
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          onPress={onSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed || submitting ? 0.85 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="whatsapp"
            size={20}
            color={colors.primaryForeground}
          />
          <Text
            style={[
              styles.submitText,
              {
                color: colors.primaryForeground,
                fontFamily: "Inter_700Bold",
              },
            ]}
          >
            إرسال الطلب عبر واتساب
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
  required,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  required?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={14}
            color={colors.mutedForeground}
          />
        ) : null}
        <Text
          style={[
            styles.fieldLabel,
            {
              color: colors.mutedForeground,
              fontFamily: "Inter_500Medium",
              writingDirection: "rtl",
            },
          ]}
        >
          {label}
          {required ? (
            <Text style={{ color: "#E5484D" }}> *</Text>
          ) : null}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground + "80"}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        textAlign="right"
        style={[
          styles.fieldInput,
          {
            color: colors.foreground,
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderRadius: colors.radius,
            fontFamily: "Inter_500Medium",
            minHeight: multiline ? 110 : 48,
            textAlignVertical: multiline ? "top" : "center",
            writingDirection: "rtl",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    gap: 22,
  },
  intro: { gap: 8, alignItems: "flex-end" },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 22,
    textAlign: "right",
    alignSelf: "stretch",
  },
  introSub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    alignSelf: "stretch",
  },
  formTitle: {
    fontSize: 16,
    textAlign: "right",
    marginBottom: 14,
  },
  field: { gap: 6, marginBottom: 14 },
  fieldLabelRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    textAlign: "right",
  },
  fieldInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  imagePicker: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  imagePickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerTitle: {
    fontSize: 14,
    textAlign: "right",
  },
  imagePickerSub: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "right",
  },
  imagePreview: {
    borderWidth: 1,
    overflow: "hidden",
  },
  imagePreviewImg: {
    width: "100%",
    height: 180,
  },
  imagePreviewActions: {
    flexDirection: "row-reverse",
    gap: 8,
    padding: 10,
  },
  imageActionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  imageActionText: {
    fontSize: 12,
  },
  privacyNote: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  privacyText: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  submitBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitText: {
    fontSize: 15,
  },
});
