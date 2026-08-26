export type Campaign = {
  id: string;
  titleAr: string;
  titleEn: string;
  location: string;
  category: "food" | "shelter" | "education" | "health" | "water";
  raised: number;
  goal: number;
  beneficiaries: number;
  descriptionAr: string;
  urgent: boolean;
};

export type NewsItem = {
  id: string;
  titleAr: string;
  date: string;
  excerptAr: string;
};

export type Stat = {
  id: string;
  labelAr: string;
  value: string;
  iconName: string;
};

export const seedCampaigns: Campaign[] = [
  {
    id: "c1",
    titleAr: "إفطار صائم في رمضان",
    titleEn: "Ramadan Iftar Drive",
    location: "اليمن، صنعاء",
    category: "food",
    raised: 184500,
    goal: 250000,
    beneficiaries: 12400,
    descriptionAr:
      "توفير وجبات إفطار يومية للأسر المحتاجة في المناطق المتضررة خلال شهر رمضان المبارك.",
    urgent: true,
  },
  {
    id: "c2",
    titleAr: "حفر آبار المياه النظيفة",
    titleEn: "Clean Water Wells",
    location: "الصومال، مقديشو",
    category: "water",
    raised: 96000,
    goal: 180000,
    beneficiaries: 8200,
    descriptionAr:
      "حفر وتجهيز آبار مياه نظيفة لتوفير مصدر دائم للمياه في القرى النائية.",
    urgent: false,
  },
  {
    id: "c3",
    titleAr: "كفالة طلاب الأيتام",
    titleEn: "Orphan Education Sponsorship",
    location: "سوريا، إدلب",
    category: "education",
    raised: 312000,
    goal: 400000,
    beneficiaries: 1850,
    descriptionAr:
      "تغطية مصاريف التعليم والكتب والزي المدرسي للأطفال الأيتام في المخيمات.",
    urgent: false,
  },
  {
    id: "c4",
    titleAr: "إغاثة ضحايا الزلزال",
    titleEn: "Earthquake Relief Fund",
    location: "تركيا، أنطاكيا",
    category: "shelter",
    raised: 540000,
    goal: 750000,
    beneficiaries: 23000,
    descriptionAr:
      "توفير مأوى مؤقت ومساعدات عاجلة للعائلات التي فقدت منازلها بسبب الزلزال.",
    urgent: true,
  },
  {
    id: "c5",
    titleAr: "حملة الكسوة الشتوية",
    titleEn: "Winter Clothing Campaign",
    location: "لبنان، البقاع",
    category: "shelter",
    raised: 67000,
    goal: 120000,
    beneficiaries: 5400,
    descriptionAr:
      "توزيع ملابس وبطانيات شتوية على اللاجئين قبل قدوم موجات البرد.",
    urgent: false,
  },
  {
    id: "c6",
    titleAr: "العيادات الطبية المتنقلة",
    titleEn: "Mobile Medical Clinics",
    location: "السودان، الخرطوم",
    category: "health",
    raised: 142000,
    goal: 200000,
    beneficiaries: 9300,
    descriptionAr:
      "تشغيل عيادات متنقلة لتقديم الرعاية الصحية الأولية في المناطق الريفية.",
    urgent: false,
  },
];

export const seedNews: NewsItem[] = [
  {
    id: "n1",
    titleAr: "افتتاح مدرسة الوليد للتعليم في اليمن",
    date: "2026-04-22",
    excerptAr:
      "افتتحت مؤسسة الوليد للإنسانية مدرسة جديدة لخدمة أكثر من 600 طالب في منطقة تعز.",
  },
  {
    id: "n2",
    titleAr: "توزيع 10,000 سلة غذائية في غزة",
    date: "2026-04-15",
    excerptAr:
      "ضمن الاستجابة الإنسانية المستمرة، تم توزيع آلاف السلال الغذائية على الأسر المحتاجة.",
  },
  {
    id: "n3",
    titleAr: "تجديد مستشفى الأطفال في حلب",
    date: "2026-04-08",
    excerptAr:
      "اكتمال أعمال تجديد جناح الأطفال بالكامل، بما في ذلك تجهيزه بأحدث المعدات الطبية.",
  },
  {
    id: "n4",
    titleAr: "اتفاقية شراكة مع منظمة الأغذية العالمية",
    date: "2026-03-30",
    excerptAr:
      "توقيع اتفاقية تعاون لتنفيذ برامج الأمن الغذائي في خمس دول إفريقية.",
  },
];

export const seedStats: Stat[] = [
  { id: "s1", labelAr: "مستفيد", value: "1.2M", iconName: "users" },
  { id: "s2", labelAr: "حملة نشطة", value: "48", iconName: "heart" },
  { id: "s3", labelAr: "دولة", value: "32", iconName: "globe" },
];
