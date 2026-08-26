import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image, // إضافة عنصر الصور
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useColors } from "@/hooks/useColors";

// --- منطقة إضافة البيانات والروابط يدوياً ---
const MANUAL_NEWS = [
  {
    id: "1",
    titleAr: "إطلاق القافلة الطبية الكبرى",
    excerptAr: "بدأت المؤسسة اليوم بتسيير قافلة طبية متكاملة لتقديم الرعاية الصحية في المناطق الريفية.",
    date: new Date().toISOString(),
    // ضع رابط الصورة هنا بين العلامتين ""
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=500", 
  },
  {
    id: "2",
    titleAr: "افتتاح مركز الأمل للتعليم",
    excerptAr: "تم بحمد الله افتتاح المركز التعليمي الجديد لدعم الأطفال الموهوبين وتوفير بيئة تعليمية حديثة.",
    date: new Date().toISOString(),
    // اترك الرابط فارغاً لتجربة شكل "الصورة البديلة"
    imageUrl: "", 
  },
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function NewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { loaded } = useCampaigns();

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      {/* قسم الصورة المخصصة */}
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={[styles.mainImage, { borderRadius: colors.radius }]}
            resizeMode="cover"
          />
        ) : (
          /* خلفية بديلة في حال عدم وجود صورة */
          <LinearGradient
            colors={[colors.primary + "33", colors.accent + "22"]}
            style={[styles.mainImage, { borderRadius: colors.radius, justifyContent: 'center', alignItems: 'center' }]}
          >
            <Feather name="image" size={40} color={colors.primary + "55"} />
          </LinearGradient>
        )}

        {/* الترقيم (Badge) فوق الصورة */}
        <View style={[styles.coverBadge, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <Text style={[styles.coverBadgeText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>
            #{String(index + 1).padStart(2, "0")}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <Feather name="calendar" size={12} color={colors.accent} />
          <Text style={[styles.date, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            {formatDate(item.date)}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold", writingDirection: "rtl" }]}>
          {item.titleAr}
        </Text>

        <Text style={[styles.excerpt, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", writingDirection: "rtl" }]}>
          {item.excerptAr}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.readMore,
            {
              borderColor: colors.primary + "55",
              borderRadius: 10,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="arrow-left" size={14} color={colors.primary} />
          <Text style={[styles.readMoreText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            اقرأ المزيد
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={MANUAL_NEWS} // نستخدم المصفوفة اليدوية التي أنشأناها بالأعلى
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold", textAlign: 'right' }]}>
              تغطية مستمرة لجهودنا
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: 'right' }]}>
              اطلع على أحدث الأخبار والتقارير من ميدان العمل الإنساني.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20, paddingTop: 16 },
  header: { marginBottom: 18, gap: 4 },
  headerTitle: { fontSize: 20 },
  headerSub: { fontSize: 13, lineHeight: 20 },
  card: { borderWidth: 1, overflow: "hidden", marginBottom: 10 },
  imageContainer: {
    height: 180, // زيادة الارتفاع لتبدو الصور واضحة
    margin: 8,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverBadgeText: { fontSize: 11 },
  cardBody: { padding: 16, paddingTop: 4, gap: 8 },
  metaRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  date: { fontSize: 11 },
  title: { fontSize: 17, lineHeight: 26, textAlign: "right" },
  excerpt: { fontSize: 14, lineHeight: 22, textAlign: "right" },
  readMore: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  readMoreText: { fontSize: 12 },
});
